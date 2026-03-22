import { FastifyInstance } from 'fastify';
import { query } from '../database/db';
import { postingQueue } from '../queues';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.middleware';
import { ffmpegService } from '../services/ffmpeg.service';
import { transcriptionService } from '../services/transcription.service';
import { aiService } from '../services/ai.service';
import { config } from '../config';
import path from 'path';
import fs from 'fs';

export async function clipsRoutes(fastify: FastifyInstance) {
  // Get all clips
  fastify.get('/clips', { preHandler: authMiddleware }, async (request: AuthenticatedRequest, reply) => {
    const { status } = request.query as { status?: string };
    const userId = request.user!.id;

    try {
      let queryText = 'SELECT * FROM clips WHERE user_id = $1';
      const params: any[] = [userId];

      if (status) {
        queryText += ' AND status = $2';
        params.push(status);
      }

      queryText += ' ORDER BY created_at DESC';

      const result = await query(queryText, params);

      return reply.send({ clips: result.rows });
    } catch (error) {
      console.error('Error fetching clips:', error);
      return reply.code(500).send({ error: 'Failed to fetch clips' });
    }
  });

  // Get clip by ID
  fastify.get('/clips/:id', { preHandler: authMiddleware }, async (request: AuthenticatedRequest, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user!.id;

    try {
      const result = await query('SELECT * FROM clips WHERE id = $1 AND user_id = $2', [id, userId]);

      if (result.rows.length === 0) {
        return reply.code(404).send({ error: 'Clip not found' });
      }

      return reply.send({ clip: result.rows[0] });
    } catch (error) {
      console.error('Error fetching clip:', error);
      return reply.code(500).send({ error: 'Failed to fetch clip' });
    }
  });

  // Update clip
  fastify.patch('/clips/:id', { preHandler: authMiddleware }, async (request: AuthenticatedRequest, reply) => {
    const { id } = request.params as { id: string };
    const { title, caption, hashtags } = request.body as any;
    const userId = request.user!.id;

    try {
      const result = await query(
        `UPDATE clips SET title = COALESCE($1, title), caption = COALESCE($2, caption),
         hashtags = COALESCE($3, hashtags), updated_at = NOW()
         WHERE id = $4 AND user_id = $5 RETURNING *`,
        [title, caption, hashtags, id, userId]
      );

      if (result.rows.length === 0) {
        return reply.code(404).send({ error: 'Clip not found or access denied' });
      }

      return reply.send({ success: true, clip: result.rows[0] });
    } catch (error) {
      console.error('Error updating clip:', error);
      return reply.code(500).send({ error: 'Failed to update clip' });
    }
  });

  // Publish clip
  fastify.post('/clips/publish', { preHandler: authMiddleware }, async (request: AuthenticatedRequest, reply) => {
    const { clipId, platforms, scheduledFor } = request.body as {
      clipId: number;
      platforms: string[];
      scheduledFor?: string;
    };
    const userId = request.user!.id;

    try {
      // Verify clip ownership
      const clipCheck = await query('SELECT user_id FROM clips WHERE id = $1', [clipId]);
      if (clipCheck.rows.length === 0 || clipCheck.rows[0].user_id !== userId) {
        return reply.code(403).send({ error: 'Access denied' });
      }

      // Add to clip queue (don't trigger posting worker yet - wait for manual publish or scheduled time)
      const result = await query(
        `INSERT INTO clip_queue (clip_id, user_id, platforms, scheduled_for, status)
         VALUES ($1, $2, $3, $4, 'queued')
         RETURNING *`,
        [clipId, userId, platforms, scheduledFor || new Date()]
      );

      const queueItem = result.rows[0];

      // Note: We don't add to posting queue here anymore
      // The clip will be posted when user clicks "Publish Now" or at scheduled time

      return reply.send({ success: true, queueItem });
    } catch (error) {
      console.error('Error publishing clip:', error);
      return reply.code(500).send({ error: 'Failed to publish clip' });
    }
  });

  // Get clip queue
  fastify.get('/clips/queue', { preHandler: authMiddleware }, async (request: AuthenticatedRequest, reply) => {
    const userId = request.user!.id;

    try {
      const result = await query(
        `SELECT cq.*, c.title, c.caption, c.file_path, c.thumbnail_path, c.duration
         FROM clip_queue cq
         JOIN clips c ON cq.clip_id = c.id
         WHERE cq.user_id = $1
         ORDER BY cq.scheduled_for ASC`,
        [userId]
      );

      return reply.send({ queue: result.rows });
    } catch (error) {
      console.error('Error fetching queue:', error);
      return reply.code(500).send({ error: 'Failed to fetch queue' });
    }
  });

  // Update queue item (reschedule)
  fastify.patch('/clips/queue/:id', { preHandler: authMiddleware }, async (request: AuthenticatedRequest, reply) => {
    const { id } = request.params as { id: string };
    const { scheduledFor, platforms } = request.body as { scheduledFor?: string; platforms?: string[] };
    const userId = request.user!.id;

    try {
      const result = await query(
        `UPDATE clip_queue 
         SET scheduled_for = COALESCE($1, scheduled_for),
             platforms = COALESCE($2, platforms),
             updated_at = NOW()
         WHERE id = $3 AND user_id = $4
         RETURNING *`,
        [scheduledFor, platforms, id, userId]
      );

      if (result.rows.length === 0) {
        return reply.code(404).send({ error: 'Queue item not found or access denied' });
      }

      return reply.send({ success: true, queueItem: result.rows[0] });
    } catch (error) {
      console.error('Error updating queue item:', error);
      return reply.code(500).send({ error: 'Failed to update queue item' });
    }
  });

  // Delete queue item
  fastify.delete('/clips/queue/:id', { preHandler: authMiddleware }, async (request: AuthenticatedRequest, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user!.id;

    try {
      const result = await query(
        'DELETE FROM clip_queue WHERE id = $1 AND user_id = $2 RETURNING id',
        [id, userId]
      );

      if (result.rows.length === 0) {
        return reply.code(404).send({ error: 'Queue item not found or access denied' });
      }

      return reply.send({ success: true, message: 'Queue item removed' });
    } catch (error) {
      console.error('Error deleting queue item:', error);
      return reply.code(500).send({ error: 'Failed to delete queue item' });
    }
  });

  // Publish queue item now
  fastify.post('/clips/queue/:id/publish', { preHandler: authMiddleware }, async (request: AuthenticatedRequest, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user!.id;

    try {
      // Get queue item
      const queueResult = await query(
        'SELECT * FROM clip_queue WHERE id = $1 AND user_id = $2',
        [id, userId]
      );

      if (queueResult.rows.length === 0) {
        return reply.code(404).send({ error: 'Queue item not found or access denied' });
      }

      const queueItem = queueResult.rows[0];

      // Update status to processing
      await query(
        'UPDATE clip_queue SET status = $1, updated_at = NOW() WHERE id = $2',
        ['processing', id]
      );

      // Add to posting queue immediately
      await postingQueue.add('post-clip', {
        queueId: queueItem.id,
        clipId: queueItem.clip_id,
        platforms: queueItem.platforms,
      });

      return reply.send({ success: true, message: 'Publishing started' });
    } catch (error) {
      console.error('Error publishing queue item:', error);
      return reply.code(500).send({ error: 'Failed to publish' });
    }
  });

  // Delete clip
  fastify.delete('/clips/:id', { preHandler: authMiddleware }, async (request: AuthenticatedRequest, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user!.id;

    try {
      // Get clip info before deleting (verify ownership)
      const clipResult = await query('SELECT file_path, thumbnail_path FROM clips WHERE id = $1 AND user_id = $2', [id, userId]);
      
      if (clipResult.rows.length === 0) {
        return reply.code(404).send({ error: 'Clip not found or access denied' });
      }

      const clip = clipResult.rows[0];

      // Delete from database
      await query('DELETE FROM clips WHERE id = $1 AND user_id = $2', [id, userId]);

      // Delete files (convert relative paths to absolute)
      const filePath = clip.file_path.startsWith('/') 
        ? path.join(config.storage.clipsDir, clip.file_path.replace('/clips/', ''))
        : clip.file_path;
      const thumbnailPath = clip.thumbnail_path && clip.thumbnail_path.startsWith('/') 
        ? path.join(config.storage.clipsDir, clip.thumbnail_path.replace('/clips/', ''))
        : clip.thumbnail_path;
      
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      if (thumbnailPath && fs.existsSync(thumbnailPath)) {
        fs.unlinkSync(thumbnailPath);
      }

      return reply.send({ success: true, message: 'Clip deleted successfully' });
    } catch (error) {
      console.error('Error deleting clip:', error);
      return reply.code(500).send({ error: 'Failed to delete clip' });
    }
  });

  // Generate caption for clip
  fastify.post('/clips/:id/caption', { preHandler: authMiddleware }, async (request: AuthenticatedRequest, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user!.id;

    try {
      const clipResult = await query('SELECT * FROM clips WHERE id = $1 AND user_id = $2', [id, userId]);
      
      if (clipResult.rows.length === 0) {
        return reply.code(404).send({ error: 'Clip not found' });
      }

      const clip = clipResult.rows[0];

      await query(
        'UPDATE clips SET status = $1 WHERE id = $2',
        ['processing', id]
      );

      // Process transcription and add captions in background
      setTimeout(async () => {
        try {
          // Convert relative path back to absolute for processing
          const originalPath = clip.file_path.startsWith('/') 
            ? path.join(config.storage.clipsDir, clip.file_path.replace('/clips/', ''))
            : clip.file_path;
          const userDir = path.dirname(originalPath);
          
          console.log(`Starting transcription for clip ${id}...`);
          console.log(`Original path: ${originalPath}`);
          
          // Step 1: Extract audio from video
          const audioFilename = `audio_${Date.now()}.mp3`;
          const audioPath = path.join(userDir, audioFilename);
          await ffmpegService.extractAudio(originalPath, audioPath);
          console.log(`Audio extracted: ${audioPath}`);
          
          // Step 2: Transcribe audio to text with timestamps
          const segments = await transcriptionService.transcribeAudio(audioPath);
          console.log(`Transcription complete: ${segments.length} segments`);
          
          // Step 3: Generate SRT subtitle file
          const srtFilename = `subtitles_${Date.now()}.srt`;
          const srtPath = path.join(userDir, srtFilename);
          transcriptionService.generateSRTFile(segments, srtPath);
          console.log(`SRT file created: ${srtPath}`);
          
          // Step 4: Burn subtitles into video
          const captionedFilename = `cap_${Date.now()}.mp4`;
          const captionedPath = path.join(userDir, captionedFilename);
          
          console.log(`Burning subtitles into video...`);
          await ffmpegService.addSubtitles(originalPath, srtPath, captionedPath, {
            fontSize: 24,
            fontColor: '&HFFFFFF&',
            backgroundColor: '&H000000&',
          });
          console.log(`Subtitles burned into video: ${captionedPath}`);
          
          // Step 5: Generate thumbnail from captioned video
          const captionedThumbnailFilename = `cap_thumb_${Date.now()}.jpg`;
          const captionedThumbnailPath = path.join(userDir, captionedThumbnailFilename);
          await ffmpegService.generateThumbnail(captionedPath, captionedThumbnailPath);
          
          // Step 6: Generate caption text for social media
          const fullTranscript = segments.map(s => s.text).join(' ');
          const socialCaption = await aiService.generateCaption(clip.title, fullTranscript);
          
          // Step 7: Clean up temporary files
          if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
          
          // Convert absolute paths to relative paths for serving
          const relativeVideoPath = captionedPath.replace(/\\/g, '/').replace(/^.*\/clips\//, '/clips/');
          const relativeThumbnailPath = captionedThumbnailPath.replace(/\\/g, '/').replace(/^.*\/clips\//, '/clips/');
          
          // Step 8: Update database with relative paths
          await query(
            'UPDATE clips SET caption = $1, status = $2, file_path = $3, thumbnail_path = $4 WHERE id = $5',
            [socialCaption, 'generated', relativeVideoPath, relativeThumbnailPath, id]
          );
          
          console.log(`Clip ${id} captioning complete!`);
        } catch (error) {
          console.error('Error in caption generation:', error);
          await query(
            'UPDATE clips SET status = $1 WHERE id = $2',
            ['error', id]
          );
        }
      }, 1000);

      return reply.send({ success: true, message: 'Caption generation started' });
    } catch (error) {
      console.error('Error generating caption:', error);
      return reply.code(500).send({ error: 'Failed to generate caption' });
    }
  });

  // Apply style to clip
  fastify.post('/clips/:id/style', { preHandler: authMiddleware }, async (request: AuthenticatedRequest, reply) => {
    const { id } = request.params as { id: string };
    const { style } = request.body as { style: string };
    const userId = request.user!.id;

    console.log(`Style request received for clip ${id}: ${style}`);

    try {
      // Get clip info and verify ownership
      const clipResult = await query('SELECT * FROM clips WHERE id = $1 AND user_id = $2', [id, userId]);
      
      if (clipResult.rows.length === 0) {
        return reply.code(404).send({ error: 'Clip not found' });
      }

      const clip = clipResult.rows[0];
      
      // Convert relative path back to absolute for processing
      const originalPath = clip.file_path.startsWith('/') 
        ? path.join(config.storage.clipsDir, clip.file_path.replace('/clips/', ''))
        : clip.file_path;
      const userDir = path.dirname(originalPath);
      
      console.log(`Original clip path: ${originalPath}`);
      console.log(`User directory: ${userDir}`);
      
      // Update status to processing
      await query(
        'UPDATE clips SET status = $1 WHERE id = $2',
        ['processing', id]
      );

      console.log(`Clip ${id} status updated to processing`);

      // Process video with style in background
      setTimeout(async () => {
        try {
          console.log(`Starting style processing for clip ${id} with style: ${style}`);
          
          const styledFilename = `styled_${Date.now()}.mp4`;
          const styledPath = path.join(userDir, styledFilename);
          
          console.log(`Styled clip will be saved to: ${styledPath}`);
          
          // Apply style based on selection
          switch (style) {
            case 'modern':
              console.log('Applying modern style...');
              await ffmpegService.applyVideoFilter(originalPath, styledPath, 'eq=brightness=0.05:contrast=1.1');
              break;
            case 'bold':
              console.log('Applying bold style...');
              await ffmpegService.applyVideoFilter(originalPath, styledPath, 'eq=contrast=1.3:saturation=1.4');
              break;
            case 'elegant':
              console.log('Applying elegant style...');
              await ffmpegService.applyVideoFilter(originalPath, styledPath, 'eq=saturation=0.8:contrast=1.05');
              break;
            case 'playful':
              console.log('Applying playful style...');
              await ffmpegService.applyVideoFilter(originalPath, styledPath, 'eq=saturation=1.5:brightness=0.08');
              break;
            case 'cinematic':
              console.log('Applying cinematic style...');
              await ffmpegService.applyVideoFilter(originalPath, styledPath, 'eq=contrast=1.2:saturation=0.9,pad=iw:ih*1.2:0:(oh-ih)/2');
              break;
            default:
              console.log('No style specified, copying file...');
              fs.copyFileSync(originalPath, styledPath);
          }

          console.log(`Style applied successfully, generating thumbnail...`);

          // Generate new thumbnail for styled video
          const styledThumbnailFilename = `styled_thumb_${Date.now()}.jpg`;
          const styledThumbnailPath = path.join(userDir, styledThumbnailFilename);
          await ffmpegService.generateThumbnail(styledPath, styledThumbnailPath);

          console.log(`Thumbnail generated: ${styledThumbnailPath}`);

          // Convert absolute paths to relative paths for serving
          const relativeVideoPath = styledPath.replace(/\\/g, '/').replace(/^.*\/clips\//, '/clips/');
          const relativeThumbnailPath = styledThumbnailPath.replace(/\\/g, '/').replace(/^.*\/clips\//, '/clips/');

          // Update database with styled video path (relative paths)
          await query(
            'UPDATE clips SET style = $1, status = $2, file_path = $3, thumbnail_path = $4 WHERE id = $5',
            [style, 'generated', relativeVideoPath, relativeThumbnailPath, id]
          );

          console.log(`Clip ${id} updated in database with style "${style}"`);
        } catch (error) {
          console.error('Error applying style:', error);
          await query(
            'UPDATE clips SET status = $1 WHERE id = $2',
            ['error', id]
          );
        }
      }, 1000);

      return reply.send({ success: true, message: 'Style processing started' });
    } catch (error) {
      console.error('Error applying style:', error);
      return reply.code(500).send({ error: 'Failed to apply style' });
    }
  });
}

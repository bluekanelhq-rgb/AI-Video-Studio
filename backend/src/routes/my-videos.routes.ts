import { FastifyInstance } from 'fastify';
import { query } from '../database/db';
import { aiProcessingQueue, captionQueue } from '../queues';
import { aiService } from '../services/ai.service';
import { ffmpegService } from '../services/ffmpeg.service';
import { transcriptionService } from '../services/transcription.service';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.middleware';
import path from 'path';
import fs from 'fs';
import { config } from '../config';

export async function myVideosRoutes(fastify: FastifyInstance) {
  // Get user's uploaded videos
  fastify.get('/my-videos', { preHandler: authMiddleware }, async (request: AuthenticatedRequest, reply) => {
    const userId = request.user!.id;

    try {
      const result = await query(
        `SELECT id, title, file_path as "filePath", thumbnail_path as "thumbnailPath", 
         duration, status, has_transcript as "hasTranscript", has_caption as "hasCaption",
         style, created_at as "createdAt"
         FROM my_videos WHERE user_id = $1 ORDER BY created_at DESC`,
        [userId]
      );

      return reply.send({ videos: result.rows });
    } catch (error) {
      console.error('Error fetching my videos:', error);
      return reply.code(500).send({ error: 'Failed to fetch videos' });
    }
  });

  // Upload video
  fastify.post('/my-videos/upload', { preHandler: authMiddleware }, async (request: AuthenticatedRequest, reply) => {
    try {
      console.log('Upload request received');
      const userId = request.user!.id;
      
      // Get multipart data
      const parts = request.parts();
      let savedFilePath: string = '';
      let originalFilename: string = '';
      let userDir: string = '';
      
      // Process all parts
      for await (const part of parts) {
        if (part.type === 'file') {
          console.log('Receiving file:', part.filename);
          
          originalFilename = part.filename;
          
          // Create user directory
          userDir = path.join(config.storage.uploadDir, `user_${userId}`);
          if (!fs.existsSync(userDir)) {
            fs.mkdirSync(userDir, { recursive: true });
          }

          // Save file directly from stream (faster)
          const safeFilename = `${Date.now()}_${part.filename}`;
          savedFilePath = path.join(userDir, safeFilename);
          
          const writeStream = fs.createWriteStream(savedFilePath);
          
          // Pipe the file stream to write stream
          part.file.pipe(writeStream);
          
          // Wait for write to complete
          await new Promise<void>((resolve, reject) => {
            writeStream.on('finish', () => resolve());
            writeStream.on('error', reject);
          });
          
          console.log('File saved:', savedFilePath);
        }
      }
      
      if (!savedFilePath) {
        return reply.code(400).send({ error: 'No file uploaded' });
      }
      
      if (!userId) {
        return reply.code(400).send({ error: 'User ID required' });
      }

      // Get video duration using FFmpeg
      let duration = 0;
      try {
        const durationFloat = await ffmpegService.getVideoDuration(savedFilePath);
        duration = Math.round(durationFloat); // Round to nearest second
        console.log('Video duration:', duration, 'seconds');
      } catch (error) {
        console.error('Error getting video duration:', error);
        // Continue without duration
      }

      // Generate thumbnail
      let thumbnailPath = '';
      try {
        const thumbnailFilename = `thumb_${Date.now()}.jpg`;
        thumbnailPath = path.join(userDir, thumbnailFilename);
        await ffmpegService.generateThumbnail(savedFilePath, thumbnailPath);
        console.log('Thumbnail generated:', thumbnailPath);
      } catch (error) {
        console.error('Error generating thumbnail:', error);
        // Continue without thumbnail
      }

      // Convert absolute paths to relative paths for serving
      const relativeVideoPath = savedFilePath.replace(/\\/g, '/').replace(/^.*\/uploads\//, '/uploads/');
      const relativeThumbnailPath = thumbnailPath ? thumbnailPath.replace(/\\/g, '/').replace(/^.*\/uploads\//, '/uploads/') : '';

      // Save to database with relative paths
      const result = await query(
        `INSERT INTO my_videos (user_id, title, file_path, thumbnail_path, duration, status)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [userId, originalFilename, relativeVideoPath, relativeThumbnailPath, duration, 'uploaded']
      );

      console.log('Upload complete! Video ID:', result.rows[0].id);

      return reply.send({ 
        success: true, 
        video: result.rows[0],
        message: 'Video uploaded successfully'
      });
    } catch (error: any) {
      console.error('Upload error:', error.message);
      return reply.code(500).send({ 
        error: error.message || 'Failed to upload video' 
      });
    }
  });

  // Transcribe video
  fastify.post('/my-videos/:id/transcribe', { preHandler: authMiddleware }, async (request: AuthenticatedRequest, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user!.id;

    try {
      // Verify ownership
      const ownerCheck = await query('SELECT user_id FROM my_videos WHERE id = $1', [id]);
      if (ownerCheck.rows.length === 0 || ownerCheck.rows[0].user_id !== userId) {
        return reply.code(404).send({ error: 'Video not found' });
      }

      // Update status
      await query(
        'UPDATE my_videos SET status = $1 WHERE id = $2',
        ['transcribing', id]
      );

      // Add to transcription queue (mock for now)
      setTimeout(async () => {
        await query(
          'UPDATE my_videos SET has_transcript = true, status = $1 WHERE id = $2',
          ['transcribed', id]
        );
      }, 2000);

      return reply.send({ success: true, message: 'Transcription started' });
    } catch (error) {
      console.error('Error transcribing video:', error);
      return reply.code(500).send({ error: 'Failed to transcribe video' });
    }
  });

  // Generate caption (with speech-to-text transcription)
  fastify.post('/my-videos/:id/caption', { preHandler: authMiddleware }, async (request: AuthenticatedRequest, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user!.id;

    try {
      const videoResult = await query('SELECT * FROM my_videos WHERE id = $1 AND user_id = $2', [id, userId]);
      
      if (videoResult.rows.length === 0) {
        return reply.code(404).send({ error: 'Video not found' });
      }

      const video = videoResult.rows[0];

      await query(
        'UPDATE my_videos SET status = $1 WHERE id = $2',
        ['processing', id]
      );

      // Process transcription and add captions in background
      setTimeout(async () => {
        try {
          // Convert relative path back to absolute for processing
          const originalPath = video.file_path.startsWith('/') 
            ? path.join(config.storage.uploadDir, video.file_path.replace('/uploads/', ''))
            : video.file_path;
          const userDir = path.dirname(originalPath);
          
          console.log(`Starting transcription for video ${id}...`);
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
            fontColor: '&HFFFFFF&', // White
            backgroundColor: '&H000000&', // Black
          });
          console.log(`Subtitles burned into video: ${captionedPath}`);
          
          // Step 5: Generate thumbnail from captioned video
          const captionedThumbnailFilename = `cap_thumb_${Date.now()}.jpg`;
          const captionedThumbnailPath = path.join(userDir, captionedThumbnailFilename);
          await ffmpegService.generateThumbnail(captionedPath, captionedThumbnailPath);
          
          // Step 6: Generate caption text for social media
          const fullTranscript = segments.map(s => s.text).join(' ');
          const socialCaption = await aiService.generateCaption(video.title, fullTranscript);
          
          // Step 7: Clean up temporary files
          if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
          
          // Convert absolute paths to relative paths for serving
          const relativeVideoPath = captionedPath.replace(/\\/g, '/').replace(/^.*\/uploads\//, '/uploads/');
          const relativeThumbnailPath = captionedThumbnailPath.replace(/\\/g, '/').replace(/^.*\/uploads\//, '/uploads/');
          
          // Step 8: Update database with relative paths
          await query(
            'UPDATE my_videos SET has_caption = true, status = $1, caption = $2, file_path = $3, thumbnail_path = $4 WHERE id = $5',
            ['ready', socialCaption, relativeVideoPath, relativeThumbnailPath, id]
          );
          
          console.log(`Video ${id} captioning complete!`);
        } catch (error) {
          console.error('Error in caption generation:', error);
          await query(
            'UPDATE my_videos SET status = $1 WHERE id = $2',
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

  // Apply style
  fastify.post('/my-videos/:id/style', { preHandler: authMiddleware }, async (request: AuthenticatedRequest, reply) => {
    const { id } = request.params as { id: string };
    const { style } = request.body as { style: string };
    const userId = request.user!.id;

    console.log(`Style request received for video ${id}: ${style}`);

    try {
      // Get video info and verify ownership
      const videoResult = await query('SELECT * FROM my_videos WHERE id = $1 AND user_id = $2', [id, userId]);
      
      if (videoResult.rows.length === 0) {
        return reply.code(404).send({ error: 'Video not found' });
      }

      const video = videoResult.rows[0];
      
      // Convert relative path back to absolute for processing
      const originalPath = video.file_path.startsWith('/') 
        ? path.join(config.storage.uploadDir, video.file_path.replace('/uploads/', ''))
        : video.file_path;
      const userDir = path.dirname(originalPath);
      
      console.log(`Original video path: ${originalPath}`);
      console.log(`User directory: ${userDir}`);
      
      // Update status to processing
      await query(
        'UPDATE my_videos SET status = $1 WHERE id = $2',
        ['processing', id]
      );

      console.log(`Video ${id} status updated to processing`);

      // Process video with style in background
      setTimeout(async () => {
        try {
          console.log(`Starting style processing for video ${id} with style: ${style}`);
          
          const styledFilename = `styled_${Date.now()}.mp4`;
          const styledPath = path.join(userDir, styledFilename);
          
          console.log(`Styled video will be saved to: ${styledPath}`);
          
          // Apply style based on selection
          switch (style) {
            case 'modern':
              // Clean, minimal - slight brightness increase
              console.log('Applying modern style...');
              await ffmpegService.applyVideoFilter(originalPath, styledPath, 'eq=brightness=0.05:contrast=1.1');
              break;
            case 'bold':
              // High contrast, vibrant
              console.log('Applying bold style...');
              await ffmpegService.applyVideoFilter(originalPath, styledPath, 'eq=contrast=1.3:saturation=1.4');
              break;
            case 'elegant':
              // Sophisticated - slight desaturation, soft
              console.log('Applying elegant style...');
              await ffmpegService.applyVideoFilter(originalPath, styledPath, 'eq=saturation=0.8:contrast=1.05');
              break;
            case 'playful':
              // Fun, energetic - increased saturation
              console.log('Applying playful style...');
              await ffmpegService.applyVideoFilter(originalPath, styledPath, 'eq=saturation=1.5:brightness=0.08');
              break;
            case 'cinematic':
              // Film-like - letterbox and color grading
              console.log('Applying cinematic style...');
              await ffmpegService.applyVideoFilter(originalPath, styledPath, 'eq=contrast=1.2:saturation=0.9,pad=iw:ih*1.2:0:(oh-ih)/2');
              break;
            default:
              // No style, just copy
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
          const relativeVideoPath = styledPath.replace(/\\/g, '/').replace(/^.*\/uploads\//, '/uploads/');
          const relativeThumbnailPath = styledThumbnailPath.replace(/\\/g, '/').replace(/^.*\/uploads\//, '/uploads/');

          // Update database with styled video path (relative paths)
          await query(
            'UPDATE my_videos SET style = $1, status = $2, file_path = $3, thumbnail_path = $4 WHERE id = $5',
            [style, 'styled', relativeVideoPath, relativeThumbnailPath, id]
          );

          console.log(`Video ${id} updated in database with style "${style}"`);
        } catch (error) {
          console.error('Error applying style:', error);
          await query(
            'UPDATE my_videos SET status = $1 WHERE id = $2',
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

  // Delete video
  fastify.delete('/my-videos/:id', { preHandler: authMiddleware }, async (request: AuthenticatedRequest, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user!.id;

    try {
      // Get video info and verify ownership
      const result = await query('SELECT file_path, thumbnail_path FROM my_videos WHERE id = $1 AND user_id = $2', [id, userId]);
      
      if (result.rows.length > 0) {
        const filePath = result.rows[0].file_path;
        const thumbnailPath = result.rows[0].thumbnail_path;
        
        // Convert relative paths to absolute for deletion
        const absoluteFilePath = filePath.startsWith('/') 
          ? path.join(config.storage.uploadDir, filePath.replace('/uploads/', ''))
          : filePath;
        const absoluteThumbnailPath = thumbnailPath && thumbnailPath.startsWith('/') 
          ? path.join(config.storage.uploadDir, thumbnailPath.replace('/uploads/', ''))
          : thumbnailPath;
        
        // Delete files
        if (fs.existsSync(absoluteFilePath)) {
          fs.unlinkSync(absoluteFilePath);
        }
        if (absoluteThumbnailPath && fs.existsSync(absoluteThumbnailPath)) {
          fs.unlinkSync(absoluteThumbnailPath);
        }
      }

      // Delete from database
      await query('DELETE FROM my_videos WHERE id = $1 AND user_id = $2', [id, userId]);

      return reply.send({ success: true, message: 'Video deleted successfully' });
    } catch (error) {
      console.error('Error deleting video:', error);
      return reply.code(500).send({ error: 'Failed to delete video' });
    }
  });

  // Add video to posting queue
  fastify.post('/my-videos/:id/queue', { preHandler: authMiddleware }, async (request: AuthenticatedRequest, reply) => {
    const { id } = request.params as { id: string };
    const { platforms, scheduledFor } = request.body as {
      platforms: string[];
      scheduledFor?: string;
    };
    const userId = request.user!.id;

    try {
      // Get video info and verify ownership
      const videoResult = await query('SELECT * FROM my_videos WHERE id = $1 AND user_id = $2', [id, userId]);
      
      if (videoResult.rows.length === 0) {
        return reply.code(404).send({ error: 'Video not found' });
      }

      const video = videoResult.rows[0];

      if (!video.has_caption) {
        return reply.code(400).send({ error: 'Video must have a caption before adding to queue' });
      }

      // Create a clip entry for this video
      const clipResult = await query(
        `INSERT INTO clips (user_id, video_id, title, caption, file_path, thumbnail_path, duration, status)
         VALUES ($1, NULL, $2, $3, $4, $5, $6, 'ready') RETURNING *`,
        [video.user_id, video.title, video.caption, video.file_path, video.thumbnail_path, video.duration]
      );

      const clip = clipResult.rows[0];

      // Add to clip queue
      const queueResult = await query(
        `INSERT INTO clip_queue (clip_id, user_id, platforms, scheduled_for, status)
         VALUES ($1, $2, $3, $4, 'queued') RETURNING *`,
        [clip.id, video.user_id, platforms, scheduledFor || new Date()]
      );

      const queueItem = queueResult.rows[0];

      console.log(`Video ${id} added to queue as clip ${clip.id}`);

      return reply.send({ 
        success: true, 
        message: 'Video added to posting queue',
        queueItem,
        clipId: clip.id
      });
    } catch (error) {
      console.error('Error adding video to queue:', error);
      return reply.code(500).send({ error: 'Failed to add video to queue' });
    }
  });
}

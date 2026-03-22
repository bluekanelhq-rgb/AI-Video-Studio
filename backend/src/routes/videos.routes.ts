import { FastifyInstance } from 'fastify';
import { query } from '../database/db';
import { videoDownloadQueue, clipGenerationQueue } from '../queues';
import { youtubeService } from '../services/youtube.service';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.middleware';

export async function videosRoutes(fastify: FastifyInstance) {
  // Process video from URL
  fastify.post('/video/process', { preHandler: authMiddleware }, async (request: AuthenticatedRequest, reply) => {
    const { videoUrl } = request.body as { videoUrl: string };
    const userId = request.user!.id;

    try {
      // Validate URL
      const isValid = await youtubeService.validateVideo(videoUrl);
      if (!isValid) {
        return reply.code(400).send({ error: 'Invalid or inaccessible YouTube URL' });
      }

      // Extract video ID
      const videoId = youtubeService.extractVideoId(videoUrl);
      if (!videoId) {
        return reply.code(400).send({ error: 'Invalid YouTube URL' });
      }

      // Get video info
      const videoInfo = await youtubeService.getVideoInfo(videoId);
      if (!videoInfo) {
        return reply.code(404).send({ error: 'Video not found' });
      }

      // Save to database
      const result = await query(
        `INSERT INTO videos (user_id, video_id, title, description, url, status)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [userId, videoId, videoInfo.title, videoInfo.description, videoUrl, 'pending']
      );

      const video = result.rows[0];

      // Add to download queue
      await videoDownloadQueue.add('download-video', {
        videoId: video.id,
        videoUrl,
        userId,
      }, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      });

      return reply.send({ 
        success: true, 
        video,
        message: 'Video queued for processing. This may take a few minutes depending on video length.'
      });
    } catch (error: any) {
      console.error('Error processing video:', error);
      
      // Provide helpful error messages
      let errorMessage = 'Failed to process video';
      if (error.message?.includes('Invalid')) {
        errorMessage = 'Invalid YouTube URL. Please check the URL and try again.';
      } else if (error.message?.includes('not found')) {
        errorMessage = 'Video not found or is unavailable.';
      } else if (error.message?.includes('inaccessible')) {
        errorMessage = error.message;
      }
      
      return reply.code(500).send({ error: errorMessage });
    }
  });

  // Get video status
  fastify.get('/video/:id', { preHandler: authMiddleware }, async (request: AuthenticatedRequest, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user!.id;

    try {
      const result = await query('SELECT * FROM videos WHERE id = $1 AND user_id = $2', [id, userId]);

      if (result.rows.length === 0) {
        return reply.code(404).send({ error: 'Video not found' });
      }

      const video = result.rows[0];

      // Get clips for this video
      const clipsResult = await query(
        'SELECT COUNT(*) as clip_count FROM clips WHERE video_id = $1 AND user_id = $2',
        [id, userId]
      );

      // Get job progress from BullMQ
      let progress = 0;
      let jobStatus = 'unknown';
      
      try {
        // Check download queue for active/waiting jobs
        const downloadJobs = await videoDownloadQueue.getJobs(['active', 'waiting', 'delayed']);
        const downloadJob = downloadJobs.find(j => j.data.videoId === parseInt(id));
        
        if (downloadJob) {
          const jobProgress = await downloadJob.progress;
          progress = typeof jobProgress === 'number' ? jobProgress : 0;
          jobStatus = await downloadJob.getState();
          console.log(`Download job found - Progress: ${progress}%, Status: ${jobStatus}`);
        } else {
          // Check clip generation queue
          const clipJobs = await clipGenerationQueue.getJobs(['active', 'waiting', 'delayed']);
          const clipJob = clipJobs.find(j => j.data.videoId === parseInt(id));
          
          if (clipJob) {
            const jobProgress = await clipJob.progress;
            progress = typeof jobProgress === 'number' ? jobProgress : 0;
            jobStatus = await clipJob.getState();
            console.log(`Clip generation job found - Progress: ${progress}%, Status: ${jobStatus}`);
          } else {
            // If no active jobs, set progress based on video status
            if (video.status === 'downloaded') {
              progress = 80;
            } else if (video.status === 'processed') {
              progress = 100;
            } else if (video.status.startsWith('generating_clip_')) {
              progress = 85;
            }
            console.log(`No active job found, using status-based progress: ${progress}%`);
          }
        }
      } catch (error) {
        console.error('Error fetching job progress:', error);
        // Fallback to status-based progress
        if (video.status === 'downloaded') {
          progress = 80;
        } else if (video.status === 'processed') {
          progress = 100;
        } else if (video.status.startsWith('generating_clip_')) {
          progress = 85;
        }
      }

      return reply.send({ 
        video,
        clipCount: parseInt(clipsResult.rows[0].clip_count),
        progress,
        jobStatus
      });
    } catch (error) {
      console.error('Error fetching video:', error);
      return reply.code(500).send({ error: 'Failed to fetch video' });
    }
  });
}

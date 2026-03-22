import { Worker, Job } from 'bullmq';
import { config } from '../config';
import { ffmpegService } from '../services/ffmpeg.service';
import { query } from '../database/db';
import path from 'path';
import fs from 'fs';

const connection = {
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
};

interface ClipGenerationJob {
  videoId: number;
  videoPath: string;
  userId: number;
  clipDuration?: number;
}

export const clipGenerationWorker = new Worker<ClipGenerationJob>(
  'clip-generation',
  async (job: Job<ClipGenerationJob>) => {
    const { videoId, videoPath, userId, clipDuration = 120 } = job.data;

    try {
      await job.updateProgress(10);
      console.log(`Generating clips for video ${videoId}`);

      // Get video info from database
      const videoResult = await query('SELECT title FROM videos WHERE id = $1', [videoId]);
      const videoTitle = videoResult.rows[0]?.title || 'Video';

      // Create clips directory
      const clipsDir = path.join(config.storage.clipsDir, `user_${userId}`, `video_${videoId}`);
      if (!fs.existsSync(clipsDir)) {
        fs.mkdirSync(clipsDir, { recursive: true });
      }

      await job.updateProgress(30);

      // Get video duration and calculate number of clips
      const videoDuration = await ffmpegService.getVideoDuration(videoPath);
      const clipDurationSeconds = 120; // 2 minutes
      const clipCount = Math.ceil(videoDuration / clipDurationSeconds); // Use ceil to include remaining footage
      
      console.log(`Video duration: ${videoDuration}s, generating ${clipCount} clips of up to ${clipDurationSeconds}s each`);
      
      const clipIds: number[] = [];

      for (let i = 0; i < clipCount; i++) {
        const startTime = i * clipDurationSeconds;
        const remainingDuration = videoDuration - startTime;
        const actualClipDuration = Math.min(clipDurationSeconds, remainingDuration);
        const endTime = startTime + actualClipDuration;
        
        // Round values for database storage
        const durationInt = Math.round(actualClipDuration);
        const startTimeInt = Math.round(startTime);
        const endTimeInt = Math.round(endTime);
        
        // Create clip title: "{Video Title} Clip-{i}"
        const clipTitle = `${videoTitle} Clip-${i + 1}`;
        
        // Update status
        await query(
          'UPDATE videos SET status = $1, updated_at = NOW() WHERE id = $2',
          [`generating_clip_${i + 1}`, videoId]
        );
        
        console.log(`Creating clip ${i + 1} of ${clipCount} (${startTime}s - ${endTime}s, duration: ${actualClipDuration}s)`);
        
        // Generate single clip (keep original aspect ratio)
        const clipPath = path.join(clipsDir, `clip_${i + 1}_${Date.now()}.mp4`);
        await ffmpegService.extractClip(videoPath, clipPath, startTime, actualClipDuration);
        
        // Generate thumbnail
        const thumbnailPath = clipPath.replace('.mp4', '_thumb.jpg');
        await ffmpegService.generateThumbnail(clipPath, thumbnailPath);

        // Convert absolute paths to relative paths for serving
        const relativeVideoPath = clipPath.replace(/\\/g, '/').replace(/^.*\/clips\//, '/clips/');
        const relativeThumbnailPath = thumbnailPath.replace(/\\/g, '/').replace(/^.*\/clips\//, '/clips/');

        // Save to database with rounded integer values, relative paths, and title
        const result = await query(
          `INSERT INTO clips (user_id, video_id, title, file_path, thumbnail_path, duration, start_time, end_time, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
          [userId, videoId, clipTitle, relativeVideoPath, relativeThumbnailPath, durationInt, startTimeInt, endTimeInt, 'generated']
        );

        clipIds.push(result.rows[0].id);
        
        // Update progress
        const progress = 30 + ((i + 1) / clipCount) * 60;
        await job.updateProgress(progress);
      }

      await job.updateProgress(90);

      // Update video status
      await query(
        'UPDATE videos SET status = $1, updated_at = NOW() WHERE id = $2',
        ['processed', videoId]
      );

      await job.updateProgress(100);

      return { success: true, clipIds, clipCount: clipIds.length };
    } catch (error) {
      console.error(`Error generating clips for video ${videoId}:`, error);
      throw error;
    }
  },
  {
    connection,
    concurrency: config.workers.maxConcurrentJobs,
  }
);

import { Worker, Job } from 'bullmq';
import { config } from '../config';
import { youtubeService } from '../services/youtube.service';
import { query } from '../database/db';
import path from 'path';
import fs from 'fs';

const connection = {
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
};

interface VideoDownloadJob {
  videoId: number;
  videoUrl: string;
  userId: number;
}

export const videoDownloadWorker = new Worker<VideoDownloadJob>(
  'video-download',
  async (job: Job<VideoDownloadJob>) => {
    const { videoId, videoUrl, userId } = job.data;

    try {
      await job.updateProgress(10);
      console.log(`Starting download for video ${videoId}`);

      // Create user directory if not exists
      const userDir = path.join(config.storage.uploadDir, `user_${userId}`);
      if (!fs.existsSync(userDir)) {
        fs.mkdirSync(userDir, { recursive: true });
      }

      const outputPath = path.join(userDir, `video_${videoId}_${Date.now()}.mp4`);

      await job.updateProgress(10);

      // Download video with progress callback
      await youtubeService.downloadVideo(videoUrl, outputPath, async (progress: number) => {
        // Map download progress to 10-80% of job progress
        const jobProgress = 10 + (progress * 0.7);
        await job.updateProgress(Math.min(jobProgress, 80));
      });

      await job.updateProgress(80);

      // Update database
      await query(
        'UPDATE videos SET status = $1, file_path = $2, updated_at = NOW() WHERE id = $3',
        ['downloaded', outputPath, videoId]
      );

      await job.updateProgress(90);

      // Trigger clip generation
      const { clipGenerationQueue } = require('../queues');
      await clipGenerationQueue.add('generate-clips', {
        videoId,
        videoPath: outputPath,
        userId,
      });

      console.log(`Clip generation queued for video ${videoId}`);

      await job.updateProgress(100);

      return { success: true, filePath: outputPath };
    } catch (error) {
      console.error(`Error downloading video ${videoId}:`, error);
      await query(
        'UPDATE videos SET status = $1, updated_at = NOW() WHERE id = $2',
        ['failed', videoId]
      );
      throw error;
    }
  },
  {
    connection,
    concurrency: config.workers.maxConcurrentJobs,
  }
);

videoDownloadWorker.on('completed', (job) => {
  console.log(`Video download job ${job.id} completed`);
});

videoDownloadWorker.on('failed', (job, err) => {
  console.error(`Video download job ${job?.id} failed:`, err);
});

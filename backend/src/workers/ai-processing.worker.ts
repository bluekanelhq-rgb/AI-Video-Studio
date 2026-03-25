import { Worker, Job } from 'bullmq';
import { config } from '../config';
import { aiService } from '../services/ai.service';
import { query } from '../database/db';

// Parse Railway Redis URL or use individual config
const getConnection = () => {
  if (config.redis.url) {
    const url = new URL(config.redis.url);
    return {
      host: url.hostname,
      port: parseInt(url.port),
      password: url.password,
      username: url.username !== 'default' ? url.username : undefined,
    };
  }
  return {
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password,
  };
};

const connection = getConnection();

interface AIProcessingJob {
  clipId: number;
  videoTitle: string;
  videoDescription: string;
}

export const aiProcessingWorker = new Worker<AIProcessingJob>(
  'ai-processing',
  async (job: Job<AIProcessingJob>) => {
    const { clipId, videoTitle, videoDescription } = job.data;

    try {
      await job.updateProgress(20);
      console.log(`Processing AI for clip ${clipId}`);

      // Generate caption
      const caption = await aiService.generateCaption(videoTitle, videoDescription);

      await job.updateProgress(50);

      // Generate hashtags
      const hashtags = await aiService.generateHashtags(caption, 'general');

      await job.updateProgress(70);

      // Generate hook title
      const hookTitle = await aiService.generateHookTitle(videoTitle);

      await job.updateProgress(90);

      // Update clip in database
      await query(
        `UPDATE clips SET title = $1, caption = $2, hashtags = $3, status = $4, updated_at = NOW()
         WHERE id = $5`,
        [hookTitle, caption, hashtags.join(' '), 'ready', clipId]
      );

      await job.updateProgress(100);

      return { success: true, caption, hashtags, hookTitle };
    } catch (error) {
      console.error(`Error processing AI for clip ${clipId}:`, error);
      throw error;
    }
  },
  {
    connection,
    concurrency: config.workers.maxConcurrentJobs,
  }
);

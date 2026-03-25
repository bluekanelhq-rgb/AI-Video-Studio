import { Worker, Job } from 'bullmq';
import { config } from '../config';
import { query } from '../database/db';
import { socialMediaService } from '../services/social-media.service';

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

interface PostingJob {
  queueId: number;
  clipId: number;
  platforms: string[];
}

export const postingWorker = new Worker<PostingJob>(
  'social-posting',
  async (job: Job<PostingJob>) => {
    const { queueId, clipId, platforms } = job.data;

    try {
      await job.updateProgress(10);
      console.log(`Posting clip ${clipId} to platforms:`, platforms);

      // Get clip details
      const clipResult = await query(
        `SELECT c.*, u.id as user_id FROM clips c
         JOIN users u ON c.user_id = u.id
         WHERE c.id = $1`,
        [clipId]
      );

      if (clipResult.rows.length === 0) {
        throw new Error('Clip not found');
      }

      const clip = clipResult.rows[0];

      await job.updateProgress(30);

      // Post to each platform
      const results = [];
      for (const platform of platforms) {
        try {
          // Get social account
          const accountResult = await query(
            'SELECT * FROM social_accounts WHERE user_id = $1 AND platform = $2 AND connected = true',
            [clip.user_id, platform]
          );

          if (accountResult.rows.length === 0) {
            throw new Error(`No connected account for ${platform}`);
          }

          const account = accountResult.rows[0];

          // Post to platform
          const postResult = await socialMediaService.post(platform, {
            videoPath: clip.file_path,
            caption: clip.caption,
            hashtags: clip.hashtags,
            accessToken: account.access_token,
          });

          // Log success
          await query(
            `INSERT INTO posting_logs (clip_id, user_id, platform, post_id, status, response_data)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [clipId, clip.user_id, platform, postResult.postId, 'success', JSON.stringify(postResult)]
          );

          results.push({ platform, success: true, postId: postResult.postId });
        } catch (error: any) {
          // Log failure
          await query(
            `INSERT INTO posting_logs (clip_id, user_id, platform, status, error_message)
             VALUES ($1, $2, $3, $4, $5)`,
            [clipId, clip.user_id, platform, 'failed', error.message]
          );

          results.push({ platform, success: false, error: error.message });
        }
      }

      await job.updateProgress(90);

      // Update queue status
      const allSuccess = results.every((r) => r.success);
      await query(
        'UPDATE clip_queue SET status = $1, updated_at = NOW() WHERE id = $2',
        [allSuccess ? 'posted' : 'failed', queueId]
      );

      await job.updateProgress(100);

      return { success: allSuccess, results };
    } catch (error) {
      console.error(`Error posting clip ${clipId}:`, error);
      await query(
        'UPDATE clip_queue SET status = $1, retry_count = retry_count + 1, updated_at = NOW() WHERE id = $2',
        ['failed', queueId]
      );
      throw error;
    }
  },
  {
    connection,
    concurrency: 3,
  }
);

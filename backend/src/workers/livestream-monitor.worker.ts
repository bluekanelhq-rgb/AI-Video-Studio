import { Worker, Job } from 'bullmq';
import { config } from '../config';
import { youtubeService } from '../services/youtube.service';
import { query } from '../database/db';
import { clipGenerationQueue } from '../queues';

const connection = {
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
};

interface LiveStreamMonitorJob {
  channelId: number;
  youtubeChannelId: string;
  userId: number;
}

export const liveStreamMonitorWorker = new Worker<LiveStreamMonitorJob>(
  'live-stream-monitor',
  async (job: Job<LiveStreamMonitorJob>) => {
    const { channelId, youtubeChannelId, userId } = job.data;

    try {
      console.log(`Checking live streams for channel ${youtubeChannelId}`);

      // Check for live streams
      const liveStreams = await youtubeService.checkLiveStreams(youtubeChannelId);

      if (liveStreams.length > 0) {
        for (const stream of liveStreams) {
          const videoId = stream.id.videoId;

          // Check if already processing
          const existing = await query(
            'SELECT id FROM videos WHERE video_id = $1 AND is_live = true',
            [videoId]
          );

          if (existing.rows.length === 0) {
            // Add new live stream
            const result = await query(
              `INSERT INTO videos (user_id, channel_id, video_id, title, url, is_live, status)
               VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
              [
                userId,
                channelId,
                videoId,
                stream.snippet.title,
                `https://youtube.com/watch?v=${videoId}`,
                true,
                'live',
              ]
            );

            console.log(`New live stream detected: ${stream.snippet.title}`);

            // Start clip generation for live stream
            await clipGenerationQueue.add(
              'generate-live-clips',
              {
                videoId: result.rows[0].id,
                videoUrl: `https://youtube.com/watch?v=${videoId}`,
                userId,
                isLive: true,
              },
              {
                repeat: {
                  every: 120000, // Generate clips every 2 minutes
                },
              }
            );
          }
        }
      }

      // Update last checked
      await query('UPDATE channels SET last_checked = NOW() WHERE id = $1', [channelId]);

      return { success: true, liveStreamsFound: liveStreams.length };
    } catch (error) {
      console.error(`Error monitoring channel ${channelId}:`, error);
      throw error;
    }
  },
  {
    connection,
    concurrency: 10,
  }
);

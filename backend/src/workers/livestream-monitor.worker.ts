import { Worker, Job } from 'bullmq';
import { config } from '../config';
import { youtubeService } from '../services/youtube.service';
import { query } from '../database/db';
import { videoDownloadQueue } from '../queues';

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
        console.log(`Found ${liveStreams.length} live stream(s) for channel ${youtubeChannelId}`);
        
        for (const stream of liveStreams) {
          const videoId = stream.id.videoId;

          // Check if already processing
          const existing = await query(
            'SELECT id, status FROM videos WHERE video_id = $1',
            [videoId]
          );

          if (existing.rows.length === 0) {
            // Add new live stream to database
            const result = await query(
              `INSERT INTO videos (user_id, channel_id, video_id, title, url, status)
               VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
              [
                userId,
                channelId,
                videoId,
                stream.snippet.title,
                `https://youtube.com/watch?v=${videoId}`,
                'pending',
              ]
            );

            console.log(`New live stream detected: ${stream.snippet.title}`);
            console.log(`Starting download and clip generation for video ID: ${result.rows[0].id}`);

            // Add to video download queue (which will then trigger clip generation)
            await videoDownloadQueue.add(
              'download-live-stream',
              {
                videoId: result.rows[0].id,
                videoUrl: `https://youtube.com/watch?v=${videoId}`,
                userId,
              },
              {
                priority: 1, // High priority for live streams
              }
            );
          } else if (existing.rows[0].status === 'failed') {
            // Retry failed live streams
            console.log(`Retrying failed live stream: ${videoId}`);
            
            await query(
              'UPDATE videos SET status = $1, updated_at = NOW() WHERE video_id = $2',
              ['pending', videoId]
            );

            await videoDownloadQueue.add(
              'retry-live-stream',
              {
                videoId: existing.rows[0].id,
                videoUrl: `https://youtube.com/watch?v=${videoId}`,
                userId,
              },
              {
                priority: 1,
              }
            );
          } else {
            console.log(`Live stream already being processed: ${videoId} (status: ${existing.rows[0].status})`);
          }
        }
      } else {
        console.log(`No live streams found for channel ${youtubeChannelId}`);
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

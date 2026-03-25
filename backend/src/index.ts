import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import cookie from '@fastify/cookie';
import path from 'path';
import { config } from './config';
import { authRoutes } from './routes/auth.routes';
import { channelsRoutes } from './routes/channels.routes';
import { videosRoutes } from './routes/videos.routes';
import { clipsRoutes } from './routes/clips.routes';
import { socialRoutes } from './routes/social.routes';
import { myVideosRoutes } from './routes/my-videos.routes';
import { dashboardRoutes } from './routes/dashboard.routes';
import { query } from './database/db';
import { liveStreamQueue } from './queues';

const fastify = Fastify({
  logger: true,
});

// Register plugins
fastify.register(cors, {
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true, // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
});

fastify.register(cookie, {
  secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
});

fastify.register(multipart, {
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB
  },
});

// Serve uploaded videos
fastify.register(fastifyStatic, {
  root: path.join(__dirname, '../uploads'),
  prefix: '/uploads/',
});

// Serve generated clips
fastify.register(fastifyStatic, {
  root: path.join(__dirname, '../clips'),
  prefix: '/clips/',
  decorateReply: false,
});

// Health check
fastify.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Register routes
fastify.register(authRoutes, { prefix: '/api' });
fastify.register(channelsRoutes, { prefix: '/api' });
fastify.register(videosRoutes, { prefix: '/api' });
fastify.register(clipsRoutes, { prefix: '/api' });
fastify.register(socialRoutes, { prefix: '/api' });
fastify.register(myVideosRoutes, { prefix: '/api' });
fastify.register(dashboardRoutes, { prefix: '/api' });

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: config.port, host: '0.0.0.0' });
    console.log(`Server running on port ${config.port}`);
    
    // Initialize livestream monitoring for existing channels
    await initializeLivestreamMonitoring();
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

// Initialize livestream monitoring for channels that have monitoring enabled
async function initializeLivestreamMonitoring() {
  try {
    console.log('Initializing livestream monitoring for existing channels...');
    
    const result = await query(
      'SELECT id, channel_id, user_id FROM channels WHERE monitoring = true'
    );
    
    if (result.rows.length > 0) {
      console.log(`Found ${result.rows.length} channel(s) with monitoring enabled`);
      
      for (const channel of result.rows) {
        await liveStreamQueue.add(
          `monitor-channel-${channel.id}`,
          {
            channelId: channel.id,
            youtubeChannelId: channel.channel_id,
            userId: channel.user_id,
          },
          {
            repeat: {
              pattern: '*/5 * * * *', // Check every 5 minutes
            },
            jobId: `monitor-channel-${channel.id}`,
          }
        );
        console.log(`Monitoring started for channel ID: ${channel.id}`);
      }
      
      console.log('Livestream monitoring initialization complete');
    } else {
      console.log('No channels with monitoring enabled');
    }
  } catch (error) {
    console.error('Error initializing livestream monitoring:', error);
  }
}

start();

import { FastifyInstance } from 'fastify';
import { query } from '../database/db';
import { youtubeService } from '../services/youtube.service';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.middleware';
import { liveStreamQueue } from '../queues';

export async function channelsRoutes(fastify: FastifyInstance) {
  // Add channel
  fastify.post('/channels/add', { preHandler: authMiddleware }, async (request: AuthenticatedRequest, reply) => {
    const { channelUrl } = request.body as { channelUrl: string };
    const userId = request.user!.id; // Get from authenticated user

    try {
      console.log('Processing channel URL:', channelUrl);
      
      // Normalize URL - remove trailing slashes and query params
      const normalizedUrl = channelUrl.trim().replace(/\/$/, '').split('?')[0];
      
      // Extract channel ID from various YouTube URL formats
      let channelId: string | null = null;
      
      // Format 1: youtube.com/channel/UC...
      const channelMatch = normalizedUrl.match(/youtube\.com\/channel\/([A-Za-z0-9_-]+)/);
      if (channelMatch) {
        channelId = channelMatch[1];
        console.log('Found channel ID format:', channelId);
      }
      
      // Format 2: youtube.com/@username
      const handleMatch = normalizedUrl.match(/youtube\.com\/@([A-Za-z0-9_-]+)/);
      if (handleMatch && !channelId) {
        const handle = handleMatch[1];
        console.log('Found @handle format:', handle);
        
        // For @handles, we need to resolve to channel ID via API
        try {
          const searchResult = await youtubeService.searchChannelByHandle(handle);
          if (searchResult) {
            channelId = searchResult;
            console.log('Resolved handle to channel ID:', channelId);
          }
        } catch (error) {
          console.error('Error resolving channel handle:', error);
        }
      }
      
      // Format 3: youtube.com/c/customname or youtube.com/user/username
      const customMatch = normalizedUrl.match(/youtube\.com\/(?:c|user)\/([A-Za-z0-9_-]+)/);
      if (customMatch && !channelId) {
        const customName = customMatch[1];
        console.log('Found custom/user format:', customName);
        
        try {
          const searchResult = await youtubeService.searchChannelByName(customName);
          if (searchResult) {
            channelId = searchResult;
            console.log('Resolved custom name to channel ID:', channelId);
          }
        } catch (error) {
          console.error('Error resolving channel name:', error);
        }
      }

      if (!channelId) {
        console.error('Could not extract channel ID from URL:', normalizedUrl);
        return reply.code(400).send({ 
          error: 'Could not find channel. Please check the URL and make sure you have a YouTube API key configured.' 
        });
      }

      console.log('Fetching channel info for:', channelId);
      
      // Get channel info from YouTube
      const channelInfo = await youtubeService.getChannelInfo(channelId);

      if (!channelInfo) {
        return reply.code(404).send({ 
          error: 'Channel not found. Make sure the channel exists and your YouTube API key is configured.' 
        });
      }

      console.log('Channel info retrieved:', channelInfo.name);

      // Save to database
      const result = await query(
        `INSERT INTO channels (user_id, channel_id, channel_name, channel_url, subscribers, monitoring)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (user_id, channel_id) DO UPDATE
         SET channel_name = $3, subscribers = $5, updated_at = NOW()
         RETURNING *`,
        [userId, channelInfo.id, channelInfo.name, normalizedUrl, channelInfo.subscribers, true]
      );

      console.log('Channel saved to database:', result.rows[0].id);

      // Start livestream monitoring for this channel
      const channel = result.rows[0];
      await liveStreamQueue.add(
        `monitor-channel-${channel.id}`,
        {
          channelId: channel.id,
          youtubeChannelId: channelInfo.id,
          userId: userId,
        },
        {
          repeat: {
            pattern: '*/5 * * * *', // Check every 5 minutes
          },
          jobId: `monitor-channel-${channel.id}`, // Unique job ID to prevent duplicates
        }
      );

      console.log('Livestream monitoring started for channel:', channel.id);

      return reply.send({ success: true, channel: result.rows[0] });
    } catch (error: any) {
      console.error('Error adding channel:', error);
      return reply.code(500).send({ 
        error: error.message || 'Failed to add channel. Please check the URL and your YouTube API key configuration.' 
      });
    }
  });

  // Get all channels
  fastify.get('/channels', { preHandler: authMiddleware }, async (request: AuthenticatedRequest, reply) => {
    const userId = request.user!.id; // Get from authenticated user

    try {
      const result = await query(
        'SELECT * FROM channels WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
      );

      return reply.send({ channels: result.rows });
    } catch (error) {
      console.error('Error fetching channels:', error);
      return reply.code(500).send({ error: 'Failed to fetch channels' });
    }
  });

  // Toggle monitoring
  fastify.patch('/channels/:id/monitoring', { preHandler: authMiddleware }, async (request: AuthenticatedRequest, reply) => {
    const { id } = request.params as { id: string };
    const { monitoring } = request.body as { monitoring: boolean };
    const userId = request.user!.id;

    try {
      // Verify ownership
      const ownerCheck = await query('SELECT user_id, channel_id FROM channels WHERE id = $1', [id]);
      if (ownerCheck.rows.length === 0 || ownerCheck.rows[0].user_id !== userId) {
        return reply.code(403).send({ error: 'Access denied' });
      }

      const channel = ownerCheck.rows[0];

      const result = await query(
        'UPDATE channels SET monitoring = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3 RETURNING *',
        [monitoring, id, userId]
      );

      // Start or stop livestream monitoring
      if (monitoring) {
        // Start monitoring
        await liveStreamQueue.add(
          `monitor-channel-${id}`,
          {
            channelId: parseInt(id),
            youtubeChannelId: channel.channel_id,
            userId: userId,
          },
          {
            repeat: {
              pattern: '*/5 * * * *', // Check every 5 minutes
            },
            jobId: `monitor-channel-${id}`, // Unique job ID to prevent duplicates
          }
        );
        console.log('Livestream monitoring started for channel:', id);
      } else {
        // Stop monitoring - remove repeatable job
        await liveStreamQueue.removeRepeatableByKey(`monitor-channel-${id}:::*/5 * * * *`);
        console.log('Livestream monitoring stopped for channel:', id);
      }

      return reply.send({ success: true, channel: result.rows[0] });
    } catch (error) {
      console.error('Error updating channel:', error);
      return reply.code(500).send({ error: 'Failed to update channel' });
    }
  });

  // Delete channel
  fastify.delete('/channels/:id', { preHandler: authMiddleware }, async (request: AuthenticatedRequest, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user!.id;

    try {
      // Verify ownership before deleting
      const result = await query('DELETE FROM channels WHERE id = $1 AND user_id = $2 RETURNING id', [id, userId]);

      if (result.rows.length === 0) {
        return reply.code(404).send({ error: 'Channel not found or access denied' });
      }

      // Stop livestream monitoring for this channel
      try {
        await liveStreamQueue.removeRepeatableByKey(`monitor-channel-${id}:::*/5 * * * *`);
        console.log('Livestream monitoring stopped for deleted channel:', id);
      } catch (error) {
        console.log('No monitoring job to remove for channel:', id);
      }

      return reply.send({ success: true, message: 'Channel removed successfully' });
    } catch (error) {
      console.error('Error deleting channel:', error);
      return reply.code(500).send({ error: 'Failed to delete channel' });
    }
  });
}

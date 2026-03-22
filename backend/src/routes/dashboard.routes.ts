import { FastifyInstance } from 'fastify';
import { query } from '../database/db';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.middleware';

export async function dashboardRoutes(fastify: FastifyInstance) {
  // Get dashboard stats
  fastify.get('/dashboard/stats', { preHandler: authMiddleware }, async (request: AuthenticatedRequest, reply) => {
    const userId = request.user!.id;

    try {
      // Get active channels count
      const channelsResult = await query(
        'SELECT COUNT(*) as count FROM channels WHERE user_id = $1 AND monitoring = true',
        [userId]
      );
      const activeChannels = parseInt(channelsResult.rows[0].count);

      // Get total clips generated
      const clipsResult = await query(
        'SELECT COUNT(*) as count FROM clips WHERE user_id = $1',
        [userId]
      );
      const clipsGenerated = parseInt(clipsResult.rows[0].count);

      // Get queued clips count
      const queuedResult = await query(
        'SELECT COUNT(*) as count FROM clip_queue WHERE user_id = $1 AND status IN ($2, $3)',
        [userId, 'queued', 'processing']
      );
      const queuedClips = parseInt(queuedResult.rows[0].count);

      // Get posted clips count
      const postedResult = await query(
        'SELECT COUNT(*) as count FROM clip_queue WHERE user_id = $1 AND status = $2',
        [userId, 'posted']
      );
      const postedClips = parseInt(postedResult.rows[0].count);

      // Get connected accounts count
      const accountsResult = await query(
        'SELECT COUNT(*) as count FROM social_accounts WHERE user_id = $1 AND connected = true',
        [userId]
      );
      const connectedAccounts = parseInt(accountsResult.rows[0].count);

      // Get clips generated per day for the last 7 days
      const weeklyClipsResult = await query(
        `SELECT 
          DATE(created_at) as date,
          COUNT(*) as count
         FROM clips
         WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '7 days'
         GROUP BY DATE(created_at)
         ORDER BY date ASC`,
        [userId]
      );

      // Fill in missing days with 0
      const weeklyClips = [];
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        
        const found = weeklyClipsResult.rows.find((row: any) => row.date.toISOString().split('T')[0] === dateStr);
        weeklyClips.push({
          name: dayName,
          clips: found ? parseInt(found.count) : 0,
        });
      }

      // Get recent channel activity
      const recentActivityResult = await query(
        `SELECT 
          c.channel_name as channel_name,
          c.id as channel_id,
          COUNT(v.id) as clips_count,
          MAX(v.created_at) as last_activity
         FROM channels c
         LEFT JOIN videos v ON c.id = v.channel_id AND v.user_id = $1
         WHERE c.user_id = $1
         GROUP BY c.id, c.channel_name
         ORDER BY last_activity DESC NULLS LAST
         LIMIT 5`,
        [userId]
      );

      const recentActivity = recentActivityResult.rows.map((row: any) => ({
        channel: row.channel_name,
        channelId: row.channel_id,
        clips: parseInt(row.clips_count) || 0,
        status: parseInt(row.clips_count) > 0 ? 'completed' : 'idle',
        lastActivity: row.last_activity,
      }));

      return reply.send({
        stats: {
          activeChannels,
          clipsGenerated,
          queuedClips,
          postedClips,
          connectedAccounts,
        },
        weeklyClips,
        recentActivity,
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return reply.code(500).send({ error: 'Failed to fetch dashboard stats' });
    }
  });
}

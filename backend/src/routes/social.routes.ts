import { FastifyInstance } from 'fastify';
import { query } from '../database/db';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.middleware';

export async function socialRoutes(fastify: FastifyInstance) {
  // Connect social account (simplified for demo - in production use OAuth)
  fastify.post('/social/connect', { preHandler: authMiddleware }, async (request: AuthenticatedRequest, reply) => {
    const { platform, accountName } = request.body as { platform: string; accountName: string };
    const userId = request.user!.id;

    try {
      // In production, this would be called after OAuth flow
      // For demo purposes, we'll create a mock connection
      const accountId = `${platform}_${Date.now()}`;
      const mockToken = `mock_token_${Date.now()}`;
      
      const result = await query(
        `INSERT INTO social_accounts (user_id, platform, account_id, account_name, access_token, connected)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (user_id, platform, account_id) DO UPDATE
         SET account_name = $4, connected = $6, updated_at = NOW()
         RETURNING id, platform, account_id, account_name, followers, connected, created_at`,
        [userId, platform, accountId, accountName, mockToken, true]
      );

      return reply.send({ success: true, account: result.rows[0] });
    } catch (error) {
      console.error('Error connecting account:', error);
      return reply.code(500).send({ error: 'Failed to connect account' });
    }
  });

  // Get connected accounts
  fastify.get('/social/accounts', { preHandler: authMiddleware }, async (request: AuthenticatedRequest, reply) => {
    const userId = request.user!.id;

    try {
      const result = await query(
        'SELECT id, platform, account_id, account_name, followers, connected, created_at FROM social_accounts WHERE user_id = $1 AND connected = true ORDER BY created_at DESC',
        [userId]
      );

      return reply.send({ accounts: result.rows });
    } catch (error) {
      console.error('Error fetching accounts:', error);
      return reply.code(500).send({ error: 'Failed to fetch accounts' });
    }
  });

  // Disconnect account
  fastify.delete('/social/accounts/:id', { preHandler: authMiddleware }, async (request: AuthenticatedRequest, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user!.id;

    try {
      // Verify ownership before disconnecting
      const result = await query(
        'UPDATE social_accounts SET connected = false, updated_at = NOW() WHERE id = $1 AND user_id = $2 RETURNING id',
        [id, userId]
      );

      if (result.rows.length === 0) {
        return reply.code(404).send({ error: 'Account not found or access denied' });
      }

      return reply.send({ success: true, message: 'Account disconnected successfully' });
    } catch (error) {
      console.error('Error disconnecting account:', error);
      return reply.code(500).send({ error: 'Failed to disconnect account' });
    }
  });
}

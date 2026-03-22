import { FastifyRequest, FastifyReply } from 'fastify';
import { authService } from '../services/auth.service';

export interface AuthenticatedRequest extends FastifyRequest {
  user?: {
    id: number;
    email: string;
    name: string;
  };
}

export async function authMiddleware(
  request: AuthenticatedRequest,
  reply: FastifyReply
) {
  try {
    // Get token from cookie or Authorization header
    const token = 
      request.cookies?.token || 
      request.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return reply.code(401).send({ error: 'Authentication required' });
    }

    // Verify token
    const { valid, user } = await authService.verifyToken(token);

    if (!valid || !user) {
      return reply.code(401).send({ error: 'Invalid or expired token' });
    }

    // Attach user to request
    request.user = user;
  } catch (error) {
    console.error('Auth middleware error:', error);
    return reply.code(401).send({ error: 'Authentication failed' });
  }
}

// Optional auth middleware (doesn't fail if no token)
export async function optionalAuthMiddleware(
  request: AuthenticatedRequest,
  reply: FastifyReply
) {
  try {
    const token = 
      request.cookies?.token || 
      request.headers.authorization?.replace('Bearer ', '');

    if (token) {
      const { valid, user } = await authService.verifyToken(token);
      if (valid && user) {
        request.user = user;
      }
    }
  } catch (error) {
    // Silently fail for optional auth
    console.error('Optional auth middleware error:', error);
  }
}

import { FastifyInstance } from 'fastify';
import { authService } from '../services/auth.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export async function authRoutes(fastify: FastifyInstance) {
  // Register
  fastify.post('/auth/register', async (request, reply) => {
    const { email, password, name } = request.body as {
      email: string;
      password: string;
      name: string;
    };

    const result = await authService.register(email, password, name);

    if (!result.success) {
      return reply.code(400).send({ error: result.message });
    }

    // Set HTTP-only cookie
    reply.setCookie('token', result.token!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return reply.send({
      success: true,
      user: result.user,
      token: result.token,
    });
  });

  // Login
  fastify.post('/auth/login', async (request, reply) => {
    const { email, password, rememberMe } = request.body as {
      email: string;
      password: string;
      rememberMe?: boolean;
    };

    const result = await authService.login(email, password, rememberMe);

    if (!result.success) {
      return reply.code(401).send({ error: result.message });
    }

    // Set HTTP-only cookie
    const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60;
    reply.setCookie('token', result.token!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge,
      path: '/',
    });

    return reply.send({
      success: true,
      user: result.user,
      token: result.token,
    });
  });

  // Verify token / Get current user
  fastify.get('/auth/me', async (request: AuthenticatedRequest, reply) => {
    const token = 
      request.cookies?.token || 
      request.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return reply.code(401).send({ error: 'Not authenticated' });
    }

    const { valid, user } = await authService.verifyToken(token);

    if (!valid || !user) {
      return reply.code(401).send({ error: 'Invalid or expired token' });
    }

    return reply.send({ user });
  });

  // Logout
  fastify.post('/auth/logout', async (request, reply) => {
    const token = 
      request.cookies?.token || 
      request.headers.authorization?.replace('Bearer ', '');

    if (token) {
      await authService.logout(token);
    }

    // Clear cookie
    reply.clearCookie('token', { path: '/' });

    return reply.send({ success: true, message: 'Logged out successfully' });
  });

  // Clean expired sessions (can be called periodically)
  fastify.post('/auth/clean-sessions', async (request, reply) => {
    await authService.cleanExpiredSessions();
    return reply.send({ success: true, message: 'Expired sessions cleaned' });
  });
}

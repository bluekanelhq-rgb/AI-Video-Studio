import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../database/db';
import { config } from '../config';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d'; // Token expires in 7 days

export interface User {
  id: number;
  email: string;
  name: string;
  created_at: Date;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
}

export class AuthService {
  // Register new user
  async register(email: string, password: string, name: string): Promise<AuthResponse> {
    try {
      // Validate input
      if (!email || !password || !name) {
        return { success: false, message: 'All fields are required' };
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return { success: false, message: 'Invalid email format' };
      }

      // Validate password strength
      if (password.length < 6) {
        return { success: false, message: 'Password must be at least 6 characters long' };
      }

      // Check if user already exists
      const existingUser = await query(
        'SELECT id FROM users WHERE email = $1',
        [email.toLowerCase()]
      );

      if (existingUser.rows.length > 0) {
        return { success: false, message: 'Email already registered' };
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user
      const result = await query(
        'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name, created_at',
        [email.toLowerCase(), passwordHash, name]
      );

      const user = result.rows[0];

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      // Store session
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

      await query(
        'INSERT INTO sessions (user_id, token, expires_at) VALUES ($1, $2, $3)',
        [user.id, token, expiresAt]
      );

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          created_at: user.created_at,
        },
        token,
      };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, message: 'Registration failed. Please try again.' };
    }
  }

  // Login user
  async login(email: string, password: string, rememberMe: boolean = false): Promise<AuthResponse> {
    try {
      // Validate input
      if (!email || !password) {
        return { success: false, message: 'Email and password are required' };
      }

      // Find user
      const result = await query(
        'SELECT id, email, name, password_hash, created_at FROM users WHERE email = $1',
        [email.toLowerCase()]
      );

      if (result.rows.length === 0) {
        return { success: false, message: 'Invalid email or password' };
      }

      const user = result.rows[0];

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);

      if (!isValidPassword) {
        return { success: false, message: 'Invalid email or password' };
      }

      // Generate JWT token
      const expiresIn = rememberMe ? '30d' : JWT_EXPIRES_IN;
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn }
      );

      // Store session
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + (rememberMe ? 30 : 7));

      await query(
        'INSERT INTO sessions (user_id, token, expires_at) VALUES ($1, $2, $3)',
        [user.id, token, expiresAt]
      );

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          created_at: user.created_at,
        },
        token,
      };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Login failed. Please try again.' };
    }
  }

  // Verify token
  async verifyToken(token: string): Promise<{ valid: boolean; user?: User }> {
    try {
      // Verify JWT
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; email: string };

      // Check if session exists and is not expired
      const sessionResult = await query(
        'SELECT user_id FROM sessions WHERE token = $1 AND expires_at > NOW()',
        [token]
      );

      if (sessionResult.rows.length === 0) {
        return { valid: false };
      }

      // Get user data
      const userResult = await query(
        'SELECT id, email, name, created_at FROM users WHERE id = $1',
        [decoded.userId]
      );

      if (userResult.rows.length === 0) {
        return { valid: false };
      }

      const user = userResult.rows[0];

      return {
        valid: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          created_at: user.created_at,
        },
      };
    } catch (error) {
      console.error('Token verification error:', error);
      return { valid: false };
    }
  }

  // Logout user
  async logout(token: string): Promise<{ success: boolean }> {
    try {
      // Delete session
      await query('DELETE FROM sessions WHERE token = $1', [token]);
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false };
    }
  }

  // Clean expired sessions
  async cleanExpiredSessions(): Promise<void> {
    try {
      await query('DELETE FROM sessions WHERE expires_at < NOW()');
    } catch (error) {
      console.error('Clean sessions error:', error);
    }
  }
}

export const authService = new AuthService();

import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

// Ensure storage directories exist
const uploadDir = path.join(process.cwd(), 'uploads');
const clipsDir = path.join(process.cwd(), 'clips');
const tempDir = path.join(process.cwd(), 'temp');

[uploadDir, clipsDir, tempDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  
  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/ai_video_automation',
  },
  
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },
  
  youtube: {
    apiKey: process.env.YOUTUBE_API_KEY || '',
  },
  
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
  },
  
  storage: {
    uploadDir,
    clipsDir,
    tempDir,
  },
  
  workers: {
    maxConcurrentJobs: 5,
  },
};

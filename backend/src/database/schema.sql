-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table for JWT token management
CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Channels table
CREATE TABLE IF NOT EXISTS channels (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  channel_id VARCHAR(255) NOT NULL,
  channel_name VARCHAR(255) NOT NULL,
  channel_url VARCHAR(500) NOT NULL,
  subscribers VARCHAR(50),
  monitoring BOOLEAN DEFAULT true,
  last_checked TIMESTAMP,
  clips_generated INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, channel_id)
);

-- Videos table
CREATE TABLE IF NOT EXISTS videos (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  channel_id INTEGER REFERENCES channels(id) ON DELETE SET NULL,
  video_id VARCHAR(255) NOT NULL,
  title VARCHAR(500),
  description TEXT,
  url VARCHAR(500) NOT NULL,
  file_path VARCHAR(500),
  thumbnail_path VARCHAR(500),
  duration INTEGER,
  is_live BOOLEAN DEFAULT false,
  source VARCHAR(50) DEFAULT 'youtube',
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Clips table
CREATE TABLE IF NOT EXISTS clips (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  video_id INTEGER REFERENCES videos(id) ON DELETE CASCADE,
  title VARCHAR(500),
  caption TEXT,
  hashtags TEXT,
  file_path VARCHAR(500),
  thumbnail_path VARCHAR(500),
  duration INTEGER,
  aspect_ratio VARCHAR(10) DEFAULT '9:16',
  start_time INTEGER,
  end_time INTEGER,
  style VARCHAR(50),
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Clip queue table
CREATE TABLE IF NOT EXISTS clip_queue (
  id SERIAL PRIMARY KEY,
  clip_id INTEGER REFERENCES clips(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  scheduled_for TIMESTAMP,
  platforms TEXT[],
  status VARCHAR(50) DEFAULT 'queued',
  retry_count INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Social accounts table
CREATE TABLE IF NOT EXISTS social_accounts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  account_id VARCHAR(255) NOT NULL,
  account_name VARCHAR(255),
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP,
  followers VARCHAR(50),
  connected BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, platform, account_id)
);

-- Posting logs table
CREATE TABLE IF NOT EXISTS posting_logs (
  id SERIAL PRIMARY KEY,
  clip_id INTEGER REFERENCES clips(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  post_id VARCHAR(255),
  status VARCHAR(50) NOT NULL,
  response_data JSONB,
  error_message TEXT,
  posted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- My videos table (user uploaded videos)
CREATE TABLE IF NOT EXISTS my_videos (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  thumbnail_path VARCHAR(500),
  duration INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'uploaded',
  has_transcript BOOLEAN DEFAULT false,
  has_caption BOOLEAN DEFAULT false,
  caption TEXT,
  style VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_channels_user_id ON channels(user_id);
CREATE INDEX idx_channels_monitoring ON channels(monitoring);
CREATE INDEX idx_videos_user_id ON videos(user_id);
CREATE INDEX idx_videos_status ON videos(status);
CREATE INDEX idx_clips_user_id ON clips(user_id);
CREATE INDEX idx_clips_status ON clips(status);
CREATE INDEX idx_clip_queue_status ON clip_queue(status);
CREATE INDEX idx_clip_queue_scheduled ON clip_queue(scheduled_for);
CREATE INDEX idx_social_accounts_user_id ON social_accounts(user_id);
CREATE INDEX idx_posting_logs_clip_id ON posting_logs(clip_id);
CREATE INDEX idx_my_videos_user_id ON my_videos(user_id);
CREATE INDEX idx_my_videos_status ON my_videos(status);

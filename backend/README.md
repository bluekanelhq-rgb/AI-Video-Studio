# AI Video Automation Backend

Scalable backend system for automated video content creation and distribution.

## Features

- 🎥 YouTube livestream monitoring
- ✂️ Automatic clip generation (2-minute segments)
- 🤖 AI-powered caption and hashtag generation
- 📱 Multi-platform social media posting
- 🔄 BullMQ job queues for scalability
- 🎬 FFmpeg video processing
- 📊 PostgreSQL database
- ⚡ Redis for queue management

## Tech Stack

- **Node.js** with **TypeScript**
- **Fastify** - Fast web framework
- **PostgreSQL** - Primary database
- **Redis** - Queue management
- **BullMQ** - Job queue system
- **FFmpeg** - Video processing
- **OpenAI** - AI caption generation
- **YouTube Data API** - Channel monitoring

## Architecture

```
Video Source (YouTube/Riverside)
        ↓
Video Download Queue
        ↓
Clip Generation Queue
        ↓
AI Processing Queue
        ↓
Caption Generation
        ↓
Clip Queue
        ↓
Social Media Posting Queue
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your API keys
```

3. Start PostgreSQL and Redis:
```bash
docker-compose up -d
```

4. Run database migrations:
```bash
npm run migrate
```

## Development

Start the API server:
```bash
npm run dev
```

Start the workers:
```bash
npm run worker
```

## API Endpoints

### Channels
- `POST /api/channels/add` - Add YouTube channel
- `GET /api/channels` - Get all channels
- `PATCH /api/channels/:id/monitoring` - Toggle monitoring

### Videos
- `POST /api/video/process` - Process video from URL
- `GET /api/video/:id` - Get video status

### Clips
- `GET /api/clips` - Get all clips
- `GET /api/clips/:id` - Get clip by ID
- `PATCH /api/clips/:id` - Update clip
- `POST /api/clips/publish` - Publish clip
- `GET /api/clips/queue` - Get clip queue

### Social Media
- `POST /api/social/connect` - Connect social account
- `GET /api/social/accounts` - Get connected accounts
- `DELETE /api/social/accounts/:id` - Disconnect account

## Database Schema

### Tables
- `users` - User accounts
- `channels` - YouTube channels to monitor
- `videos` - Downloaded videos
- `clips` - Generated clips
- `clip_queue` - Clips waiting to be posted
- `social_accounts` - Connected social media accounts
- `posting_logs` - Post history and status

## Workers

### Video Download Worker
Downloads videos from YouTube or Riverside FM.

### Clip Generation Worker
- Segments videos into 2-minute clips
- Converts to vertical format (9:16)
- Generates thumbnails
- Optimizes for each platform

### AI Processing Worker
- Generates captions using OpenAI
- Creates hashtags
- Generates hook titles
- Detects highlights

### Posting Worker
- Posts clips to social media
- Handles OAuth tokens
- Retries failed posts
- Logs all posting activity

### Livestream Monitor Worker
- Checks channels every minute
- Detects new livestreams
- Generates clips every 2 minutes during live streams

## Queue System

All background jobs use BullMQ with:
- Automatic retries (3 attempts)
- Exponential backoff
- Job progress tracking
- Failed job logging

## Video Processing

FFmpeg operations:
- Clip extraction
- Vertical format conversion (9:16)
- Subtitle addition
- Cropping and zoom effects
- Platform-specific optimization
- Thumbnail generation

## Social Media Integration

Supported platforms:
- TikTok
- Instagram Reels
- YouTube Shorts
- Facebook
- X (Twitter)

## Scaling

The system supports:
- Multiple concurrent workers
- Thousands of clips
- Multiple users
- Background processing
- Automatic retry logic

## Environment Variables

See `.env.example` for all required configuration.

## License

MIT

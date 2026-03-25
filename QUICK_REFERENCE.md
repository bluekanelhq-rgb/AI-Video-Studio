# Quick Reference Guide

## 🚀 Start Development

```bash
# Terminal 1: Start Backend
cd backend
npm run dev

# Terminal 2: Start Workers
cd backend
npm run worker

# Terminal 3: Start Frontend
cd frontend
npm run dev
```

## 📦 Build for Production

```bash
# Build Backend
cd backend
npm run build

# Build Frontend
cd frontend
npm run build
```

## 🔧 Environment Setup

### Backend (.env)
```env
PORT=3001
DATABASE_URL=postgresql://postgres:1234@localhost:5432/ai_video_automation
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-secret-key
YOUTUBE_API_KEY=your-youtube-api-key
OPENAI_API_KEY=optional
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## 🎯 Key Features

### 1. Video Repurposing
- Paste YouTube URL
- Generates multiple 2-minute clips
- Maintains original aspect ratio

### 2. Livestream Monitoring ⭐ NEW
- Add YouTube channel
- Automatically detects live streams
- Generates clips every 5 minutes
- No manual intervention needed

### 3. Caption Generation
- Automatic transcription (Whisper.cpp)
- Burns subtitles into video
- AI-powered social media captions

### 4. Video Styling
- 5 preset styles (Modern, Bold, Elegant, Playful, Cinematic)
- Applies filters and effects
- Generates new thumbnail

### 5. Queue Management
- Schedule posts
- Multiple platforms (Instagram, Facebook)
- Publish now or schedule for later

## 📊 Database

### Run Migrations
```bash
cd backend
npm run migrate
```

### Seed Data (Optional)
```bash
cd backend
npm run seed
```

### Connect to Database
```bash
psql -U postgres -d ai_video_automation
# Password: 1234
```

## 🔍 Monitoring

### Check Redis
```bash
redis-cli
> PING
> KEYS *
> KEYS *monitor-channel*
```

### Check Active Jobs
```bash
redis-cli
> KEYS bull:*:active
> KEYS bull:*:waiting
```

### View Logs
```bash
# Backend logs
cd backend
npm run dev

# Worker logs
cd backend
npm run worker
```

## 🐛 Troubleshooting

### Backend Won't Start
```bash
# Check PostgreSQL
psql -U postgres -l

# Check Redis
redis-cli ping

# Check port
netstat -ano | findstr :3001
```

### Frontend Won't Build
```bash
# Clear cache
cd frontend
rm -rf .next node_modules
npm install
npm run build
```

### Workers Not Processing
```bash
# Check Redis connection
redis-cli ping

# Restart workers
cd backend
npm run worker
```

### Livestream Not Detected
```bash
# Check YouTube API key
echo $YOUTUBE_API_KEY

# Check monitoring jobs
redis-cli
> KEYS *monitor-channel*

# Check channel status
psql -U postgres -d ai_video_automation
> SELECT * FROM channels WHERE monitoring = true;
```

## 📝 Common Commands

### Git
```bash
git status
git add .
git commit -m "message"
git push origin main
```

### NPM
```bash
npm install          # Install dependencies
npm run dev          # Development mode
npm run build        # Production build
npm run start        # Start production server
```

### Database
```sql
-- See all tables
\dt

-- See channels
SELECT * FROM channels;

-- See videos
SELECT * FROM videos ORDER BY created_at DESC LIMIT 10;

-- See clips
SELECT * FROM clips ORDER BY created_at DESC LIMIT 10;

-- See queue
SELECT * FROM clip_queue;
```

## 🔐 Authentication

### Register User
```bash
POST http://localhost:3001/api/auth/register
{
  "email": "user@example.com",
  "password": "password123",
  "name": "User Name"
}
```

### Login
```bash
POST http://localhost:3001/api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
```

## 📚 Documentation

- [Backend Quick Start](backend/QUICK_START.md)
- [Railway Deployment](backend/RAILWAY_DEPLOYMENT.md)
- [Livestream Monitoring](backend/LIVESTREAM_MONITORING.md)
- [Livestream Feature Summary](LIVESTREAM_FEATURE_SUMMARY.md)
- [Main README](README.md)

## 🌐 URLs

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api
- Health Check: http://localhost:3001/health

## 🎨 Tech Stack

**Backend**: Node.js, TypeScript, Fastify, PostgreSQL, Redis, BullMQ, FFmpeg
**Frontend**: Next.js 14, React, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion

## 💡 Tips

1. Always start Redis and PostgreSQL before backend
2. Use separate terminals for backend, workers, and frontend
3. Check logs when something doesn't work
4. Clear browser cache if frontend behaves oddly
5. Restart workers if jobs get stuck
6. Monitor API quota in Google Cloud Console

## 🆘 Support

- Check logs first
- Review documentation
- Verify environment variables
- Test with simple cases first
- Open issue on GitHub if needed

---

**Quick Start**: `npm run dev` in backend, workers, and frontend terminals. That's it! 🚀

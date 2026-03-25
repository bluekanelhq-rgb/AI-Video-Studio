# ✅ Railway Redis & PostgreSQL Integration - Complete

## Summary

Your backend is now configured to use **Railway-hosted Redis and PostgreSQL** instead of local instances. The system supports Railway's URL format for both services.

## Changes Made

### 1. Configuration (`backend/src/config/index.ts`)
- ✅ Added `redis.url` support for Railway's `REDIS_URL` format
- ✅ Maintains backward compatibility with individual config

### 2. Queue System (`backend/src/queues/index.ts`)
- ✅ Updated to accept Railway Redis URL
- ✅ Falls back to individual config if URL not provided

### 3. All Workers (5 files)
- ✅ `video-download.worker.ts` - Updated Redis connection
- ✅ `clip-generation.worker.ts` - Updated Redis connection
- ✅ `ai-processing.worker.ts` - Updated Redis connection
- ✅ `posting.worker.ts` - Updated Redis connection
- ✅ `livestream-monitor.worker.ts` - Updated Redis connection

### 4. Environment File (`backend/.env`)
- ✅ Simplified to use only Railway URLs
- ✅ Removed local database/Redis config
- ✅ Added clear instructions for getting Railway URLs

### 5. Documentation
- ✅ Created `RAILWAY_SETUP_GUIDE.md` - Quick setup instructions
- ✅ Created `.env.railway.example` - Railway environment template
- ✅ Updated `RAILWAY_DEPLOYMENT.md` - Deployment guide

## Environment Variables

### Required Format

```env
# Railway PostgreSQL (automatically set by Railway)
DATABASE_URL=postgresql://postgres:password@host.railway.app:5432/railway

# Railway Redis (automatically set by Railway)
REDIS_URL=redis://default:password@host.railway.app:6379

# Your API Keys
YOUTUBE_API_KEY=your-youtube-api-key
JWT_SECRET=your-jwt-secret
OPENAI_API_KEY=your-openai-key (optional)
```

## How It Works

### Connection Logic

```typescript
// If REDIS_URL exists (Railway), use it
// Otherwise, fall back to individual config (local)
const connection = config.redis.url 
  ? config.redis.url 
  : {
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
    }
```

### Railway URL Format

**PostgreSQL:**
```
postgresql://postgres:password@host.railway.app:5432/railway
```

**Redis:**
```
redis://default:password@host.railway.app:6379
```

Both formats include:
- Protocol (postgresql:// or redis://)
- Username (postgres or default)
- Password
- Host (Railway domain)
- Port
- Database name (PostgreSQL only)

## Getting Railway URLs

### Method 1: Railway Dashboard

1. Go to your Railway project
2. Click on PostgreSQL service → Variables tab
3. Copy `DATABASE_URL`
4. Click on Redis service → Variables tab
5. Copy `REDIS_URL`
6. Paste both into your `backend/.env` file

### Method 2: Railway CLI

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link to project
cd backend
railway link

# Get variables
railway variables
```

## Setup Steps

### 1. Get Railway URLs
```bash
# From Railway dashboard:
# PostgreSQL → Variables → DATABASE_URL
# Redis → Variables → REDIS_URL
```

### 2. Update .env File
```bash
cd backend
# Edit .env and paste your Railway URLs
```

### 3. Run Migrations
```bash
cd backend
npm run migrate
```

### 4. Start Application
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Workers
cd backend
npm run worker

# Terminal 3: Frontend
cd frontend
npm run dev
```

## Verification

### Test Database Connection
```bash
# Should connect without errors
cd backend
npm run dev

# Check logs for:
# ✅ "Server running on port 3001"
# ❌ No "Database connection error"
```

### Test Redis Connection
```bash
# Using redis-cli
redis-cli -u redis://default:password@host.railway.app:6379 ping
# Should return: PONG
```

### Check Tables
```bash
# Connect to Railway PostgreSQL
psql postgresql://postgres:password@host.railway.app:5432/railway

# List tables
\dt

# Should show all 9 tables
```

## Benefits of Railway Databases

### PostgreSQL
- ✅ Automatic backups
- ✅ High availability
- ✅ Scalable storage
- ✅ No local setup needed
- ✅ Accessible from anywhere

### Redis
- ✅ Persistent storage
- ✅ High performance
- ✅ Automatic failover
- ✅ No local setup needed
- ✅ Shared across deployments

## Deployment

### Local Development
- Uses Railway databases
- No local PostgreSQL/Redis needed
- Same data across team members

### Production (Railway)
- Automatically uses Railway databases
- `DATABASE_URL` and `REDIS_URL` set automatically
- No additional configuration needed

## Cost Considerations

### Railway Free Tier
- **PostgreSQL**: 512MB storage, 1GB RAM
- **Redis**: 256MB storage
- **Bandwidth**: 100GB/month
- **Execution**: $5 credit/month

### Monitoring Usage
1. Go to Railway dashboard
2. Check "Usage" tab
3. Monitor storage and bandwidth
4. Upgrade if needed

## Troubleshooting

### Issue: Can't connect to database
**Solution:**
- Verify `DATABASE_URL` format
- Check Railway PostgreSQL service is running
- Test connection with psql

### Issue: Can't connect to Redis
**Solution:**
- Verify `REDIS_URL` format
- Check Railway Redis service is running
- Test with redis-cli

### Issue: Migrations fail
**Solution:**
- Check database URL is correct
- Ensure PostgreSQL service is running
- Run migrations manually: `npm run migrate`

### Issue: Workers not processing
**Solution:**
- Verify `REDIS_URL` is correct
- Check worker process is running
- Check Redis connection in logs

## Files Modified

```
backend/
├── src/
│   ├── config/
│   │   └── index.ts                      # Added redis.url support
│   ├── queues/
│   │   └── index.ts                      # Updated connection
│   └── workers/
│       ├── video-download.worker.ts      # Updated connection
│       ├── clip-generation.worker.ts     # Updated connection
│       ├── ai-processing.worker.ts       # Updated connection
│       ├── posting.worker.ts             # Updated connection
│       └── livestream-monitor.worker.ts  # Updated connection
├── .env                                  # Simplified for Railway
├── .env.railway.example                  # New: Railway template
└── RAILWAY_DEPLOYMENT.md                 # Updated

Root/
├── RAILWAY_SETUP_GUIDE.md                # New: Quick setup guide
└── RAILWAY_REDIS_POSTGRES_CHANGES.md     # This file
```

## Security Notes

1. **Never commit .env files** - They contain sensitive credentials
2. **Use strong passwords** - Railway generates secure passwords
3. **Rotate credentials** - Change passwords periodically
4. **Monitor access** - Check Railway logs for suspicious activity
5. **Use environment variables** - Never hardcode credentials

## Next Steps

1. ✅ Get Railway URLs from dashboard
2. ✅ Update `backend/.env` with URLs
3. ✅ Run migrations: `npm run migrate`
4. ✅ Test locally: `npm run dev`
5. 🚀 Deploy to Railway (optional)
6. 🎨 Deploy frontend to Vercel

## Support

- **Railway Docs**: https://docs.railway.app
- **Railway Discord**: https://discord.gg/railway
- **Railway Status**: https://status.railway.app

---

**Configuration Complete!** Your app now uses Railway's PostgreSQL and Redis. 🎉

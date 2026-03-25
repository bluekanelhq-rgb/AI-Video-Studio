# Railway Setup Guide - Quick Start

## Prerequisites
- Railway account (https://railway.app)
- GitHub account with your code pushed

## Step 1: Get Your Railway Database URLs

### PostgreSQL
1. Go to your Railway project
2. Click on **PostgreSQL** service
3. Go to **Variables** tab
4. Find and copy `DATABASE_URL`
   - Format: `postgresql://postgres:password@host.railway.app:5432/railway`

### Redis
1. Click on **Redis** service
2. Go to **Variables** tab
3. Find and copy `REDIS_URL`
   - Format: `redis://default:password@host.railway.app:6379`

## Step 2: Update Your Local .env File

Open `backend/.env` and paste your Railway URLs:

```env
# Server
PORT=3001

# Database - Railway PostgreSQL
DATABASE_URL=postgresql://postgres:password@host.railway.app:5432/railway

# Redis - Railway Redis
REDIS_URL=redis://default:password@host.railway.app:6379

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# YouTube API
YOUTUBE_API_KEY=AIzaSyCraxDcA7KYe5auDWEEeioVnDdxJveu42Y

# OpenAI (Optional)
OPENAI_API_KEY=
```

## Step 3: Run Database Migrations

```bash
cd backend
npm run migrate
```

This will create all the necessary tables in your Railway PostgreSQL database.

## Step 4: Test Locally with Railway Databases

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

Your local app is now connected to Railway databases! 🎉

## Step 5: Deploy to Railway (Optional)

If you want to deploy the backend to Railway:

1. **Create New Service**
   - Go to Railway project
   - Click "+ New"
   - Select "GitHub Repo"
   - Choose your repository
   - Set root directory to `backend`

2. **Configure Environment Variables**
   - Go to service → Variables tab
   - Add these variables:
     ```
     NODE_ENV=production
     PORT=3001
     JWT_SECRET=your-secure-secret
     YOUTUBE_API_KEY=your-key
     OPENAI_API_KEY=your-key (optional)
     ```
   - `DATABASE_URL` and `REDIS_URL` are automatically set by Railway

3. **Deploy**
   - Railway will automatically build and deploy
   - Check logs for any errors

## Verification

### Check Database Connection
```bash
# In your terminal
cd backend
npm run dev

# You should see:
# "Server running on port 3001"
# No database connection errors
```

### Check Redis Connection
```bash
# Test Redis connection
redis-cli -u redis://default:password@host.railway.app:6379 ping
# Should return: PONG
```

### Check Tables Created
```bash
# Connect to Railway PostgreSQL
psql postgresql://postgres:password@host.railway.app:5432/railway

# List tables
\dt

# You should see:
# - users
# - sessions
# - channels
# - videos
# - clips
# - clip_queue
# - social_accounts
# - posting_logs
# - my_videos
```

## Troubleshooting

### Can't Connect to Database
- Verify `DATABASE_URL` is correct
- Check Railway PostgreSQL service is running
- Ensure no firewall blocking Railway IPs

### Can't Connect to Redis
- Verify `REDIS_URL` is correct
- Check Railway Redis service is running
- Test with redis-cli

### Migrations Failed
- Check database URL format
- Ensure PostgreSQL service is running
- Check migration files exist in `backend/src/database/migrations/`

### Workers Not Processing Jobs
- Verify `REDIS_URL` is correct
- Check worker process is running (`npm run worker`)
- Check Redis connection in logs

## Important Notes

1. **Security**: Never commit `.env` file to git
2. **URLs**: Railway URLs include passwords - keep them secret
3. **Costs**: Railway has free tier limits, monitor usage
4. **Backups**: Railway provides automatic backups for databases
5. **Monitoring**: Check Railway dashboard for service health

## Next Steps

- ✅ Databases connected
- ✅ Migrations run
- ✅ App running locally with Railway databases
- 🚀 Ready to deploy backend to Railway (optional)
- 🎨 Deploy frontend to Vercel

## Support

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Check logs in Railway dashboard for errors

---

**You're all set!** Your app is now using Railway's PostgreSQL and Redis. 🎉

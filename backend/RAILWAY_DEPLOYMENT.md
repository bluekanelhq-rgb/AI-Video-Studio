# Railway Deployment Guide

Complete guide to deploy the AI Video Automation backend on Railway.

## Prerequisites

- Railway account (sign up at https://railway.app)
- GitHub account (to connect your repository)
- Your backend code pushed to a GitHub repository

## Step 1: Prepare Your Backend

### 1.1 Create a Procfile (if not exists)

Create a file named `Procfile` in the `backend` directory:

```
web: npm run start
worker: npm run worker
```

### 1.2 Update package.json scripts

Ensure your `backend/package.json` has these scripts:

```json
{
  "scripts": {
    "start": "node dist/index.js",
    "build": "tsc",
    "dev": "tsx watch src/index.ts",
    "worker": "node dist/workers/index.js",
    "migrate": "tsx src/database/migrate.ts"
  }
}
```

### 1.3 Create railway.json (optional but recommended)

Create `backend/railway.json`:

```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && npm run build"
  },
  "deploy": {
    "startCommand": "npm run start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

## Step 2: Set Up Railway Project

### 2.1 Create New Project

1. Go to https://railway.app/dashboard
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Authorize Railway to access your GitHub
5. Select your repository
6. Select the `backend` directory as the root path

### 2.2 Add PostgreSQL Database

1. In your Railway project, click "+ New"
2. Select "Database" → "PostgreSQL"
3. Railway will automatically create a PostgreSQL instance
4. Note: Railway will automatically set `DATABASE_URL` environment variable

### 2.3 Add Redis Database

1. Click "+ New" again
2. Select "Database" → "Redis"
3. Railway will automatically create a Redis instance
4. Note: Railway will automatically set `REDIS_URL` environment variable

## Step 3: Configure Environment Variables

Go to your backend service → "Variables" tab and add these:

### Required Variables

```bash
# Server
NODE_ENV=production
PORT=3001

# Database (automatically set by Railway PostgreSQL)
# DATABASE_URL=postgresql://user:password@host:port/database

# Redis (automatically set by Railway Redis)
# REDIS_URL=redis://host:port

# JWT Secret (generate a secure random string)
JWT_SECRET=your-super-secure-jwt-secret-key-here-min-32-chars

# OpenAI (optional - for AI features)
OPENAI_API_KEY=your-openai-api-key-here

# CORS (your frontend URL)
CORS_ORIGIN=https://your-frontend-domain.vercel.app
```

### Generate JWT Secret

Run this command locally to generate a secure JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Step 4: Database Setup

### 4.1 Run Migrations

After deployment, you need to run migrations:

**Option A: Using Railway CLI**

1. Install Railway CLI:
```bash
npm i -g @railway/cli
```

2. Login to Railway:
```bash
railway login
```

3. Link to your project:
```bash
cd backend
railway link
```

4. Run migrations:
```bash
railway run npm run migrate
```

**Option B: Using Railway Dashboard**

1. Go to your backend service
2. Click "Settings" → "Deploy"
3. Add a one-time deploy command:
```bash
npm run migrate
```

### 4.2 Verify Database Schema

Connect to your PostgreSQL database and verify tables were created:

```bash
railway connect postgres
```

Then run:
```sql
\dt
```

You should see all tables: users, sessions, channels, videos, clips, clip_queue, social_accounts, posting_logs, my_videos

## Step 5: Deploy Worker Service (Optional)

If you want background job processing:

1. In Railway project, click "+ New"
2. Select "Empty Service"
3. Connect to same GitHub repo
4. Set root directory to `backend`
5. In "Settings" → "Deploy":
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run worker`
6. Add same environment variables as main service

## Step 6: Configure Storage (Important!)

Railway's filesystem is ephemeral. For file uploads, you need persistent storage:

### Option A: Use Railway Volumes (Recommended)

1. Go to backend service → "Settings" → "Volumes"
2. Click "Add Volume"
3. Mount path: `/app/uploads`
4. Size: 10GB (or as needed)
5. Repeat for clips: `/app/clips`

### Option B: Use External Storage (S3, Cloudinary, etc.)

Update your code to use cloud storage instead of local filesystem.

## Step 7: Update Frontend Configuration

Update your frontend `.env.local` or `.env.production`:

```bash
NEXT_PUBLIC_API_URL=https://your-backend-service.railway.app/api
```

## Step 8: Test Deployment

### 8.1 Check Service Health

Visit: `https://your-backend-service.railway.app/health`

You should see a success response.

### 8.2 Test API Endpoints

```bash
# Test registration
curl -X POST https://your-backend-service.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","name":"Test User"}'

# Test login
curl -X POST https://your-backend-service.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

## Step 9: Monitor and Debug

### View Logs

1. Go to your service in Railway dashboard
2. Click "Deployments" tab
3. Click on latest deployment
4. View real-time logs

### Common Issues

**Issue: Database connection fails**
- Check if PostgreSQL service is running
- Verify `DATABASE_URL` is set correctly
- Check if migrations ran successfully

**Issue: Redis connection fails**
- Check if Redis service is running
- Verify `REDIS_URL` is set correctly

**Issue: File uploads fail**
- Ensure volumes are mounted correctly
- Check file permissions
- Consider using cloud storage

**Issue: CORS errors**
- Verify `CORS_ORIGIN` includes your frontend URL
- Check if frontend is using correct API URL

## Step 10: Custom Domain (Optional)

1. Go to service → "Settings" → "Domains"
2. Click "Generate Domain" for Railway subdomain
3. Or add custom domain:
   - Click "Custom Domain"
   - Enter your domain
   - Add CNAME record to your DNS:
     - Name: `api` (or subdomain of choice)
     - Value: `your-service.railway.app`

## Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| NODE_ENV | Yes | Environment | `production` |
| PORT | Yes | Server port | `3001` |
| DATABASE_URL | Yes | PostgreSQL connection | Auto-set by Railway |
| REDIS_URL | Yes | Redis connection | Auto-set by Railway |
| JWT_SECRET | Yes | JWT signing key | 64-char random string |
| OPENAI_API_KEY | No | OpenAI API key | `sk-...` |
| CORS_ORIGIN | Yes | Frontend URL | `https://app.vercel.app` |

## Useful Railway CLI Commands

```bash
# View logs
railway logs

# Run commands in production
railway run <command>

# Connect to database
railway connect postgres

# Connect to Redis
railway connect redis

# Deploy manually
railway up

# Check service status
railway status
```

## Cost Optimization

- **Starter Plan**: $5/month includes $5 credit
- **PostgreSQL**: ~$5/month for 1GB
- **Redis**: ~$5/month for 256MB
- **Bandwidth**: First 100GB free

**Tips:**
- Use Railway volumes instead of external storage
- Optimize database queries
- Implement caching with Redis
- Use CDN for static assets

## Backup Strategy

### Database Backups

Railway provides automatic backups for PostgreSQL. To create manual backup:

```bash
railway connect postgres
pg_dump -Fc > backup.dump
```

### Restore from Backup

```bash
railway connect postgres
pg_restore -d database_name backup.dump
```

## Security Checklist

- ✅ Use strong JWT_SECRET (min 32 characters)
- ✅ Enable HTTPS (automatic on Railway)
- ✅ Set proper CORS_ORIGIN
- ✅ Don't commit .env files
- ✅ Use environment variables for secrets
- ✅ Regularly update dependencies
- ✅ Monitor logs for suspicious activity
- ✅ Set up rate limiting (if needed)

## Support

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Railway Status: https://status.railway.app

## Troubleshooting

### Build Fails

Check build logs and ensure:
- All dependencies are in `package.json`
- TypeScript compiles without errors
- Build command is correct

### Deployment Succeeds but App Crashes

- Check runtime logs
- Verify all environment variables are set
- Ensure database migrations ran
- Check if port binding is correct

### Database Connection Issues

```bash
# Test connection
railway run node -e "const { Pool } = require('pg'); const pool = new Pool({ connectionString: process.env.DATABASE_URL }); pool.query('SELECT NOW()', (err, res) => { console.log(err ? err : res.rows[0]); pool.end(); });"
```

---

**Deployment Complete!** 🚀

Your backend should now be running on Railway. Update your frontend to use the Railway backend URL and test all features.

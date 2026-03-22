# Quick Start Guide

## 1. Get YouTube API Key (Required)

### Step-by-Step:

1. **Go to Google Cloud Console:**
   https://console.cloud.google.com/

2. **Create or Select a Project:**
   - Click "Select a project" at the top
   - Click "New Project"
   - Name it "AI Video Automation"
   - Click "Create"

3. **Enable YouTube Data API v3:**
   - In the search bar, type "YouTube Data API v3"
   - Click on it
   - Click "Enable"

4. **Create API Key:**
   - Go to "Credentials" (left sidebar)
   - Click "Create Credentials" → "API Key"
   - Copy the API key that appears

5. **Add to .env file:**
   - Open `backend/.env`
   - Paste your API key after `YOUTUBE_API_KEY=`
   - Save the file

Example:
```env
YOUTUBE_API_KEY=AIzaSyC1234567890abcdefghijklmnopqrstuv
```

## 2. Start the System

### Terminal 1 - Database:
```bash
cd backend
docker-compose up -d
npm run migrate
npm run seed
```

### Terminal 2 - API Server:
```bash
cd backend
npm run dev
```

### Terminal 3 - Workers:
```bash
cd backend
npm run worker
```

### Terminal 4 - Frontend:
```bash
cd frontend
npm run dev
```

## 3. Test It

1. **Open:** http://localhost:3000

2. **Add a Channel:**
   - Go to "Channels" page
   - Click "Add Channel"
   - Paste: `https://www.youtube.com/@mkbhd`
   - Click "Add Channel"

3. **Process a Video:**
   - Go to "Repurpose" page
   - Paste: `https://www.youtube.com/watch?v=jNQXAC9IVRw`
   - Click "Generate Clips"

## Troubleshooting

**"Could not find channel" error:**
- Make sure you added your YouTube API key to `.env`
- Restart the backend server after adding the key

**"Failed to find playable formats" error:**
- Try a different video (some have download restrictions)
- Use test videos from `TEST_VIDEOS.md`

**Database connection error:**
```bash
docker-compose down
docker-compose up -d
npm run migrate
```

## API Key Limits

YouTube API has a free quota:
- **10,000 units per day**
- Channel info: 1 unit
- Video info: 1 unit
- Search: 100 units

This is plenty for development and testing!

## Next Steps

Once everything works:
1. Add more channels
2. Process videos
3. Connect social media accounts (requires OAuth setup)
4. Configure posting settings

## Need Help?

Check these files:
- `TROUBLESHOOTING.md` - Common issues
- `TEST_CHANNELS.md` - Test channel URLs
- `TEST_VIDEOS.md` - Test video URLs

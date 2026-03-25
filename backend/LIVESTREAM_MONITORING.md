# Livestream Monitoring Feature

## Overview

The livestream monitoring feature automatically detects when monitored YouTube channels go live and processes the live streams to generate clips.

## How It Works

### 1. Channel Monitoring Setup

When you add a channel and enable monitoring:
- A recurring job is created to check the channel every 5 minutes
- The job runs in the background using BullMQ and Redis
- No manual intervention needed once enabled

### 2. Live Stream Detection

Every 5 minutes, the system:
- Checks if the monitored channel is currently live
- Uses YouTube Data API v3 to detect live streams
- Compares against existing videos to avoid duplicates

### 3. Automatic Processing

When a live stream is detected:
1. **Download**: The live stream is downloaded using yt-dlp
2. **Clip Generation**: The video is split into 2-minute clips
3. **Database Storage**: All clips are saved with metadata
4. **Ready for Use**: Clips are immediately available in the Repurpose section

### 4. Monitoring States

- **Enabled**: Channel is actively monitored every 5 minutes
- **Disabled**: No monitoring, but channel remains in your list
- **Deleted**: Channel removed, monitoring stopped

## Configuration

### Required Environment Variables

```env
# YouTube API Key (Required for livestream monitoring)
YOUTUBE_API_KEY=your-youtube-api-key-here

# Redis (Required for job queue)
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Get YouTube API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable "YouTube Data API v3"
4. Create credentials → API Key
5. Copy the API key to your `.env` file

## Usage

### Via Frontend

1. **Add Channel**:
   - Go to "Channels" page
   - Click "Add Channel"
   - Paste YouTube channel URL
   - Monitoring is automatically enabled

2. **Toggle Monitoring**:
   - Find the channel in your list
   - Use the "Monitor" toggle switch
   - ON = Monitoring active
   - OFF = Monitoring paused

3. **View Generated Clips**:
   - Go to "Repurpose" page
   - Clips from live streams appear automatically
   - Apply captions and styles as needed

### Via API

**Add Channel (Auto-enables monitoring)**:
```bash
POST /api/channels/add
{
  "channelUrl": "https://youtube.com/@channelname"
}
```

**Toggle Monitoring**:
```bash
PATCH /api/channels/:id/monitoring
{
  "monitoring": true
}
```

**Delete Channel (Stops monitoring)**:
```bash
DELETE /api/channels/:id
```

## Technical Details

### Monitoring Frequency

- **Check Interval**: Every 5 minutes
- **Cron Pattern**: `*/5 * * * *`
- Configurable in `backend/src/routes/channels.routes.ts`

### Job Queue

- **Queue Name**: `live-stream-monitor`
- **Worker**: `livestream-monitor.worker.ts`
- **Priority**: High (1) for live streams
- **Retry**: Automatic retry for failed streams

### Database Schema

Live streams are stored in the `videos` table:
```sql
- video_id: YouTube video ID
- channel_id: Reference to channels table
- title: Stream title
- url: YouTube URL
- status: pending → downloading → downloaded → processing → processed
```

### Worker Process

The livestream monitor worker:
1. Receives job with channel info
2. Calls YouTube API to check for live streams
3. Filters out already-processed streams
4. Adds new streams to download queue
5. Updates channel's last_checked timestamp

## Monitoring & Logs

### Check Active Monitoring Jobs

```bash
# In Redis CLI
redis-cli
> KEYS *monitor-channel*
```

### View Worker Logs

```bash
# Backend logs
npm run dev

# Look for:
# - "Checking live streams for channel..."
# - "New live stream detected: [title]"
# - "No live streams found for channel..."
```

### Common Log Messages

- ✅ `Livestream monitoring started for channel: X` - Monitoring enabled
- ✅ `Found X live stream(s) for channel Y` - Live stream detected
- ✅ `Starting download and clip generation for video ID: X` - Processing started
- ℹ️ `No live streams found for channel X` - Channel not live (normal)
- ℹ️ `Live stream already being processed: X` - Duplicate prevention working
- ⚠️ `Retrying failed live stream: X` - Automatic retry triggered

## Performance Considerations

### API Quota

YouTube Data API v3 has daily quotas:
- **Default**: 10,000 units/day
- **Live stream check**: ~100 units per check
- **Max channels**: ~100 channels checked every 5 minutes

### Resource Usage

- **CPU**: Low (only during API calls)
- **Memory**: ~50MB per worker
- **Network**: Minimal (API calls only)
- **Storage**: Depends on live stream length

### Scaling

For more channels:
1. Increase check interval (e.g., every 10 minutes)
2. Request higher API quota from Google
3. Use multiple API keys (round-robin)
4. Deploy multiple worker instances

## Troubleshooting

### Monitoring Not Working

**Check 1: YouTube API Key**
```bash
# Verify API key is set
echo $YOUTUBE_API_KEY
```

**Check 2: Redis Connection**
```bash
# Test Redis connection
redis-cli ping
# Should return: PONG
```

**Check 3: Worker Running**
```bash
# Check if worker process is running
ps aux | grep worker
```

**Check 4: Job Queue**
```bash
# Check if jobs are in queue
redis-cli
> KEYS *monitor-channel*
```

### Live Stream Not Detected

**Possible Causes**:
1. Channel is not actually live
2. YouTube API key invalid or quota exceeded
3. Channel privacy settings (private/unlisted streams)
4. API delay (can take 1-2 minutes to detect)

**Solution**:
- Wait for next check cycle (5 minutes)
- Verify channel is live on YouTube
- Check API quota in Google Cloud Console

### Clips Not Generated

**Check Video Status**:
```sql
SELECT id, title, status FROM videos 
WHERE channel_id = X 
ORDER BY created_at DESC;
```

**Possible Statuses**:
- `pending`: Waiting to download
- `downloading`: Currently downloading
- `downloaded`: Download complete, waiting for clip generation
- `processing`: Generating clips
- `processed`: Complete
- `failed`: Error occurred

**If Failed**:
- Check backend logs for errors
- Verify FFmpeg is installed
- Check disk space
- Retry by toggling monitoring off/on

## Best Practices

1. **Start Small**: Monitor 1-2 channels initially
2. **Test First**: Add a channel you know streams regularly
3. **Monitor Quota**: Check API usage in Google Cloud Console
4. **Clean Up**: Remove channels you no longer need
5. **Check Logs**: Regularly review logs for errors

## API Rate Limits

### YouTube Data API v3

- **Quota**: 10,000 units/day (default)
- **Search (live)**: 100 units per request
- **Channel info**: 1 unit per request

### Calculation Example

Monitoring 10 channels:
- 10 channels × 100 units = 1,000 units per check
- 12 checks per hour (every 5 min) = 12,000 units/hour
- **Exceeds daily quota!**

**Solution**: Increase interval to 10-15 minutes for many channels

## Future Enhancements

Potential improvements:
- [ ] Webhook-based detection (no polling needed)
- [ ] Real-time clip generation during stream
- [ ] Stream quality selection
- [ ] Custom clip duration for live streams
- [ ] Email/SMS notifications when channel goes live
- [ ] Stream analytics and metrics

## Support

For issues or questions:
1. Check logs first
2. Verify configuration
3. Review this documentation
4. Open an issue on GitHub

---

**Note**: This feature requires a valid YouTube Data API v3 key. Without it, monitoring will not work.

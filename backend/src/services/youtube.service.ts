import axios from 'axios';
import ytdl from '@distube/ytdl-core';
import { config } from '../config';
import fs from 'fs';
import path from 'path';

export class YouTubeService {
  private apiKey: string;

  constructor() {
    this.apiKey = config.youtube.apiKey;
  }

  async getChannelInfo(channelId: string) {
    try {
      if (!this.apiKey) {
        console.warn('YouTube API key not configured. Using mock data.');
        return {
          id: channelId,
          name: 'Channel Name',
          description: 'Channel description',
          subscribers: '0',
          thumbnail: 'https://via.placeholder.com/88x88',
        };
      }

      const response = await axios.get(
        `https://www.googleapis.com/youtube/v3/channels`,
        {
          params: {
            part: 'snippet,statistics',
            id: channelId,
            key: this.apiKey,
          },
        }
      );

      if (response.data.items && response.data.items.length > 0) {
        const channel = response.data.items[0];
        return {
          id: channel.id,
          name: channel.snippet.title,
          description: channel.snippet.description,
          subscribers: channel.statistics.subscriberCount,
          thumbnail: channel.snippet.thumbnails.default.url,
        };
      }

      return null;
    } catch (error) {
      console.error('Error fetching channel info:', error);
      throw error;
    }
  }

  async checkLiveStreams(channelId: string) {
    try {
      const response = await axios.get(
        `https://www.googleapis.com/youtube/v3/search`,
        {
          params: {
            part: 'snippet',
            channelId: channelId,
            eventType: 'live',
            type: 'video',
            key: this.apiKey,
          },
        }
      );

      return response.data.items || [];
    } catch (error) {
      console.error('Error checking live streams:', error);
      throw error;
    }
  }

  async getVideoInfo(videoId: string) {
    try {
      if (!this.apiKey) {
        console.warn('YouTube API key not configured. Using mock data.');
        return {
          id: videoId,
          title: 'Video Title',
          description: 'Video description',
          duration: 'PT10M30S',
          thumbnail: 'https://via.placeholder.com/480x360',
          channelId: 'unknown',
          channelTitle: 'Unknown Channel',
        };
      }

      const response = await axios.get(
        `https://www.googleapis.com/youtube/v3/videos`,
        {
          params: {
            part: 'snippet,contentDetails,statistics',
            id: videoId,
            key: this.apiKey,
          },
        }
      );

      if (response.data.items && response.data.items.length > 0) {
        const video = response.data.items[0];
        return {
          id: video.id,
          title: video.snippet.title,
          description: video.snippet.description,
          duration: video.contentDetails.duration,
          thumbnail: video.snippet.thumbnails.high.url,
          channelId: video.snippet.channelId,
          channelTitle: video.snippet.channelTitle,
        };
      }

      return null;
    } catch (error) {
      console.error('Error fetching video info:', error);
      throw error;
    }
  }

  async downloadVideo(videoUrl: string, outputPath: string, onProgress?: (progress: number) => void): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const videoId = this.extractVideoId(videoUrl);
        if (!videoId) {
          throw new Error('Invalid YouTube URL');
        }

        console.log(`Downloading video: ${videoId}`);
        console.log(`Output path: ${outputPath}`);

        // Use yt-dlp for more reliable downloads
        const { exec } = require('child_process');
        const { promisify } = require('util');
        const execAsync = promisify(exec);

        // Check if yt-dlp is installed
        try {
          await execAsync('yt-dlp --version');
        } catch (error) {
          console.warn('yt-dlp not found, falling back to ytdl-core');
          return this.downloadVideoWithYtdl(videoUrl, outputPath, resolve, reject, onProgress);
        }

        // Download with yt-dlp (best quality, merge video+audio)
        const command = `yt-dlp -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" --merge-output-format mp4 -o "${outputPath}" "${videoUrl}"`;
        
        console.log('Executing yt-dlp command...');
        
        const child = exec(command);
        
        child.stdout.on('data', (data: string) => {
          console.log(data.trim());
          
          // Parse download progress
          if (onProgress) {
            const progressMatch = data.match(/\[download\]\s+(\d+\.?\d*)%/);
            if (progressMatch) {
              const percent = parseFloat(progressMatch[1]);
              onProgress(percent);
            }
          }
        });
        
        child.stderr.on('data', (data: string) => {
          // yt-dlp outputs progress to stderr
          if (data.includes('[download]')) {
            console.log(data.trim());
            
            // Parse download progress from stderr as well
            if (onProgress) {
              const progressMatch = data.match(/\[download\]\s+(\d+\.?\d*)%/);
              if (progressMatch) {
                const percent = parseFloat(progressMatch[1]);
                onProgress(percent);
              }
            }
          }
        });
        
        child.on('close', (code: number) => {
          if (code === 0) {
            console.log(`Download completed: ${outputPath}`);
            if (onProgress) onProgress(100);
            resolve(outputPath);
          } else {
            console.error(`yt-dlp exited with code ${code}`);
            reject(new Error(`Download failed with code ${code}`));
          }
        });
        
        child.on('error', (error: Error) => {
          console.error('yt-dlp error:', error);
          reject(error);
        });

      } catch (error: any) {
        console.error('Download setup error:', error.message);
        reject(error);
      }
    });
  }

  private downloadVideoWithYtdl(videoUrl: string, outputPath: string, resolve: Function, reject: Function, onProgress?: (progress: number) => void): void {
    // Fallback to ytdl-core if yt-dlp is not available
    console.log('Using ytdl-core fallback...');
    
    ytdl.getInfo(videoUrl, {
      requestOptions: {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      },
    }).then(info => {
      console.log(`Video title: ${info.videoDetails.title}`);
      
      let format;
      try {
        format = ytdl.chooseFormat(info.formats, { 
          quality: 'highest',
          filter: format => format.hasVideo && format.hasAudio
        });
      } catch (e) {
        format = ytdl.chooseFormat(info.formats, { quality: 'highest' });
      }

      const stream = ytdl.downloadFromInfo(info, { format });
      const writeStream = fs.createWriteStream(outputPath);

      stream.pipe(writeStream);

      stream.on('progress', (chunkLength, downloaded, total) => {
        const percent = (downloaded / total * 100).toFixed(2);
        if (downloaded % 1000000 < chunkLength) {
          console.log(`Download progress: ${percent}%`);
          if (onProgress) {
            onProgress(parseFloat(percent));
          }
        }
      });

      writeStream.on('finish', () => {
        console.log(`Download completed: ${outputPath}`);
        resolve(outputPath);
      });

      writeStream.on('error', (error) => {
        console.error('Write stream error:', error);
        fs.unlink(outputPath, () => {});
        reject(error);
      });

      stream.on('error', (error) => {
        console.error('Download stream error:', error);
        fs.unlink(outputPath, () => {});
        reject(error);
      });
    }).catch(error => {
      console.error('ytdl-core error:', error);
      if (error.message.includes('playable formats')) {
        reject(new Error('Video cannot be downloaded. It may be age-restricted, private, or region-locked.'));
      } else {
        reject(error);
      }
    });
  }

  extractVideoId(url: string): string | null {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }

  async getStreamUrl(videoId: string): Promise<string> {
    try {
      const info = await ytdl.getInfo(videoId);
      const format = ytdl.chooseFormat(info.formats, {
        quality: 'highest',
        filter: 'audioandvideo',
      });
      return format.url;
    } catch (error) {
      console.error('Error getting stream URL:', error);
      throw error;
    }
  }

  async validateVideo(videoUrl: string): Promise<boolean> {
    try {
      const videoId = this.extractVideoId(videoUrl);
      if (!videoId) return false;
      
      // Validate URL format
      const valid = ytdl.validateURL(videoUrl);
      if (!valid) return false;

      // Try to get basic info to verify accessibility
      try {
        const info = await ytdl.getBasicInfo(videoUrl, {
          requestOptions: {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
          },
        });
        
        // Check if video is playable
        if (info.videoDetails.isPrivate) {
          console.warn('Video is private');
          return false;
        }
        
        return true;
      } catch (error: any) {
        console.error('Video validation error:', error.message);
        return false;
      }
    } catch (error) {
      return false;
    }
  }

  async searchChannelByHandle(handle: string): Promise<string | null> {
    try {
      if (!this.apiKey) {
        console.warn('YouTube API key not configured. Cannot search channels.');
        return null;
      }

      console.log(`Searching for channel with handle: @${handle}`);

      const response = await axios.get(
        `https://www.googleapis.com/youtube/v3/search`,
        {
          params: {
            part: 'snippet',
            q: handle,
            type: 'channel',
            maxResults: 1,
            key: this.apiKey,
          },
        }
      );

      if (response.data.items && response.data.items.length > 0) {
        const channelId = response.data.items[0].snippet.channelId;
        console.log(`Found channel ID: ${channelId}`);
        return channelId;
      }

      console.warn(`No channel found for handle: @${handle}`);
      return null;
    } catch (error: any) {
      console.error('Error searching channel by handle:', error.message);
      return null;
    }
  }

  async searchChannelByName(name: string): Promise<string | null> {
    try {
      if (!this.apiKey) {
        console.warn('YouTube API key not configured');
        return null;
      }

      const response = await axios.get(
        `https://www.googleapis.com/youtube/v3/search`,
        {
          params: {
            part: 'snippet',
            q: name,
            type: 'channel',
            maxResults: 1,
            key: this.apiKey,
          },
        }
      );

      if (response.data.items && response.data.items.length > 0) {
        return response.data.items[0].snippet.channelId;
      }

      return null;
    } catch (error) {
      console.error('Error searching channel by name:', error);
      return null;
    }
  }
}

export const youtubeService = new YouTubeService();

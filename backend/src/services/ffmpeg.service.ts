import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';
import { config } from '../config';

export class FFmpegService {
  async generateClips(
    inputPath: string,
    outputDir: string,
    clipDuration: number = 120
  ): Promise<string[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const clips: string[] = [];
        
        // Get video duration
        const duration = await this.getVideoDuration(inputPath);
        const numClips = Math.floor(duration / clipDuration);

        for (let i = 0; i < numClips; i++) {
          const startTime = i * clipDuration;
          const outputPath = path.join(
            outputDir,
            `clip_${i + 1}_${Date.now()}.mp4`
          );

          await this.extractClip(inputPath, outputPath, startTime, clipDuration);
          clips.push(outputPath);
        }

        resolve(clips);
      } catch (error) {
        reject(error);
      }
    });
  }

  async extractClip(
    inputPath: string,
    outputPath: string,
    startTime: number,
    duration: number
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .setStartTime(startTime)
        .setDuration(duration)
        .outputOptions([
          '-c:v libx264',           // Use H.264 codec
          '-preset ultrafast',       // Fastest encoding preset
          '-crf 23',                 // Good quality
          '-c:a aac',                // AAC audio codec
          '-b:a 128k'                // Audio bitrate
        ])
        .output(outputPath)
        .on('end', () => resolve(outputPath))
        .on('error', (error) => reject(error))
        .run();
    });
  }

  async convertToVertical(inputPath: string, outputPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .size('1080x1920')
        .aspect('9:16')
        .autopad()
        .outputOptions([
          '-c:v libx264',           // Use H.264 codec
          '-preset ultrafast',       // Fastest encoding preset
          '-crf 23',                 // Good quality
          '-c:a copy'                // Copy audio without re-encoding
        ])
        .output(outputPath)
        .on('end', () => resolve(outputPath))
        .on('error', (error) => reject(error))
        .run();
    });
  }

  async cropVideo(
    inputPath: string,
    outputPath: string,
    width: number,
    height: number,
    x: number = 0,
    y: number = 0
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .videoFilters(`crop=${width}:${height}:${x}:${y}`)
        .output(outputPath)
        .on('end', () => resolve(outputPath))
        .on('error', (error) => reject(error))
        .run();
    });
  }

  async addZoomEffect(inputPath: string, outputPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .videoFilters('zoompan=z=1.5:d=1:s=1080x1920')
        .output(outputPath)
        .on('end', () => resolve(outputPath))
        .on('error', (error) => reject(error))
        .run();
    });
  }

  async generateThumbnail(videoPath: string, outputPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .screenshots({
          timestamps: ['00:00:01'], // Extract from 1 second (start of video, avoiding black frames)
          filename: path.basename(outputPath),
          folder: path.dirname(outputPath),
          size: '?x1080', // Keep original aspect ratio, height 1080px for high quality
        })
        .on('end', () => resolve(outputPath))
        .on('error', (error) => reject(error));
    });
  }

  async getVideoDuration(videoPath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) {
          reject(err);
        } else {
          resolve(metadata.format.duration || 0);
        }
      });
    });
  }

  async applyVideoFilter(inputPath: string, outputPath: string, filter: string): Promise<string> {
    return new Promise((resolve, reject) => {
      console.log(`Applying filter: ${filter}`);
      console.log(`Input: ${inputPath}`);
      console.log(`Output: ${outputPath}`);
      
      ffmpeg(inputPath)
        .videoFilters(filter)
        .output(outputPath)
        .on('start', (cmd) => console.log('FFmpeg command:', cmd))
        .on('progress', (progress) => {
          if (progress.percent) {
            console.log(`Processing: ${Math.round(progress.percent)}% done`);
          }
        })
        .on('end', () => {
          console.log('Filter applied successfully');
          resolve(outputPath);
        })
        .on('error', (error) => {
          console.error('FFmpeg filter error:', error);
          reject(error);
        })
        .run();
    });
  }

  async addTextOverlay(
    inputPath: string, 
    outputPath: string, 
    text: string, 
    position: 'top' | 'bottom' | 'center' = 'bottom'
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      // Escape special characters in text for FFmpeg
      const escapedText = text.replace(/'/g, "'\\\\\\''").replace(/:/g, '\\:');
      
      // Position settings
      let yPosition = 'h-th-50'; // bottom with 50px padding
      if (position === 'top') {
        yPosition = '50';
      } else if (position === 'center') {
        yPosition = '(h-th)/2';
      }
      
      // Create text overlay filter with styling
      const textFilter = `drawtext=text='${escapedText}':fontfile=/Windows/Fonts/arial.ttf:fontsize=48:fontcolor=white:borderw=3:bordercolor=black:x=(w-text_w)/2:y=${yPosition}`;
      
      ffmpeg(inputPath)
        .videoFilters(textFilter)
        .output(outputPath)
        .on('end', () => resolve(outputPath))
        .on('error', (error) => reject(error))
        .run();
    });
  }

  async extractAudio(videoPath: string, outputPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .output(outputPath)
        .noVideo()
        .audioCodec('libmp3lame')
        .on('end', () => resolve(outputPath))
        .on('error', (error) => reject(error))
        .run();
    });
  }

  async addSubtitles(
    videoPath: string,
    subtitlePath: string,
    outputPath: string,
    style?: {
      fontSize?: number;
      fontColor?: string;
      backgroundColor?: string;
      position?: 'top' | 'bottom' | 'center';
    }
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const fontSize = style?.fontSize || 24;
      const fontColor = style?.fontColor || '&HFFFFFF&'; // White
      const bgColor = style?.backgroundColor || '&H000000&'; // Black
      
      // Properly escape path for FFmpeg on Windows
      // Replace backslashes with forward slashes and escape colons
      const escapedSubPath = subtitlePath
        .replace(/\\/g, '/')
        .replace(/:/g, '\\\\:');
      
      // Build subtitle style
      const subtitleStyle = `FontName=Arial,FontSize=${fontSize},PrimaryColour=${fontColor},BackColour=${bgColor},Bold=1,Outline=2,Shadow=1,MarginV=50`;
      
      console.log(`FFmpeg subtitle filter: subtitles=${escapedSubPath}`);
      
      ffmpeg(videoPath)
        .videoFilters(`subtitles=${escapedSubPath}:force_style='${subtitleStyle}'`)
        .output(outputPath)
        .on('start', (cmd) => console.log('FFmpeg command:', cmd))
        .on('end', () => resolve(outputPath))
        .on('error', (error) => {
          console.error('FFmpeg subtitle error:', error);
          reject(error);
        })
        .run();
    });
  }

  async optimizeForPlatform(
    inputPath: string,
    outputPath: string,
    platform: 'tiktok' | 'instagram' | 'youtube' | 'facebook'
  ): Promise<string> {
    const settings = {
      tiktok: { size: '1080x1920', bitrate: '5000k', fps: 30 },
      instagram: { size: '1080x1920', bitrate: '5000k', fps: 30 },
      youtube: { size: '1080x1920', bitrate: '8000k', fps: 60 },
      facebook: { size: '1080x1920', bitrate: '4000k', fps: 30 },
    };

    const config = settings[platform];

    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .size(config.size)
        .videoBitrate(config.bitrate)
        .fps(config.fps)
        .output(outputPath)
        .on('end', () => resolve(outputPath))
        .on('error', (error) => reject(error))
        .run();
    });
  }
}

export const ffmpegService = new FFmpegService();

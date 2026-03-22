import axios from 'axios';
import fs from 'fs';
import path from 'path';

export class RiversideService {
  async downloadRecording(recordingUrl: string, outputPath: string): Promise<string> {
    try {
      // Extract recording ID from URL
      const recordingId = this.extractRecordingId(recordingUrl);
      if (!recordingId) {
        throw new Error('Invalid Riverside URL');
      }

      // Download the recording
      const response = await axios({
        method: 'GET',
        url: recordingUrl,
        responseType: 'stream',
      });

      const writer = fs.createWriteStream(outputPath);
      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', () => resolve(outputPath));
        writer.on('error', reject);
      });
    } catch (error) {
      console.error('Error downloading Riverside recording:', error);
      throw error;
    }
  }

  extractRecordingId(url: string): string | null {
    const regex = /riverside\.fm\/recording\/([^\/]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }

  async getRecordingInfo(recordingId: string): Promise<any> {
    try {
      // This would use Riverside API if available
      // For now, return basic info
      return {
        id: recordingId,
        title: 'Riverside Recording',
        duration: 0,
      };
    } catch (error) {
      console.error('Error fetching Riverside recording info:', error);
      throw error;
    }
  }
}

export const riversideService = new RiversideService();

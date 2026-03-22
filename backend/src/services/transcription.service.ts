import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
}

export class TranscriptionService {
  private whisperPath: string;
  private modelPath: string;

  constructor() {
    // Path to whisper.cpp executable (updated to new binary name)
    this.whisperPath = path.join(__dirname, '../../whisper.cpp/whisper-cli.exe');
    this.modelPath = path.join(__dirname, '../../whisper.cpp/models/ggml-base.bin');
  }

  async transcribeAudio(audioPath: string): Promise<TranscriptSegment[]> {
    try {
      // Check if whisper.cpp is installed
      if (!fs.existsSync(this.whisperPath)) {
        console.log('Whisper.cpp not found, using mock transcription');
        return this.generateMockTranscription();
      }

      console.log('Transcribing audio with Whisper.cpp...');
      
      // Convert audio to 16kHz WAV (required by Whisper)
      const wavPath = audioPath.replace('.mp3', '_16k.wav');
      await this.convertToWav(audioPath, wavPath);
      
      // Run whisper.cpp
      const outputDir = path.dirname(audioPath);
      const command = `"${this.whisperPath}" -m "${this.modelPath}" -f "${wavPath}" -osrt -of "${outputDir}/transcript"`;
      
      console.log('Running whisper.cpp...');
      await execAsync(command);
      
      // Read generated SRT file
      const srtPath = `${outputDir}/transcript.srt`;
      if (fs.existsSync(srtPath)) {
        const segments = this.parseSRTFile(srtPath);
        
        // Clean up temporary files
        if (fs.existsSync(wavPath)) fs.unlinkSync(wavPath);
        
        console.log(`Transcription complete: ${segments.length} segments`);
        return segments;
      } else {
        console.log('SRT file not generated, using mock transcription');
        return this.generateMockTranscription();
      }
    } catch (error) {
      console.error('Error transcribing audio:', error);
      console.log('Falling back to mock transcription');
      return this.generateMockTranscription();
    }
  }

  private async convertToWav(inputPath: string, outputPath: string): Promise<void> {
    const ffmpegCommand = `ffmpeg -i "${inputPath}" -ar 16000 -ac 1 -c:a pcm_s16le "${outputPath}" -y`;
    await execAsync(ffmpegCommand);
  }

  private parseSRTFile(srtPath: string): TranscriptSegment[] {
    const content = fs.readFileSync(srtPath, 'utf-8');
    const segments: TranscriptSegment[] = [];
    
    const blocks = content.trim().split('\n\n');
    
    for (const block of blocks) {
      const lines = block.split('\n');
      if (lines.length >= 3) {
        const timeLine = lines[1];
        const text = lines.slice(2).join(' ');
        
        const timeMatch = timeLine.match(/(\d{2}):(\d{2}):(\d{2}),(\d{3}) --> (\d{2}):(\d{2}):(\d{2}),(\d{3})/);
        if (timeMatch) {
          const startSeconds = parseInt(timeMatch[1]) * 3600 + parseInt(timeMatch[2]) * 60 + parseInt(timeMatch[3]) + parseInt(timeMatch[4]) / 1000;
          const endSeconds = parseInt(timeMatch[5]) * 3600 + parseInt(timeMatch[6]) * 60 + parseInt(timeMatch[7]) + parseInt(timeMatch[8]) / 1000;
          
          segments.push({
            start: startSeconds,
            end: endSeconds,
            text: text.trim()
          });
        }
      }
    }
    
    return segments;
  }

  generateSRTFile(segments: TranscriptSegment[], outputPath: string): void {
    let srtContent = '';
    
    segments.forEach((segment, index) => {
      const startTime = this.formatSRTTime(segment.start);
      const endTime = this.formatSRTTime(segment.end);
      
      srtContent += `${index + 1}\n`;
      srtContent += `${startTime} --> ${endTime}\n`;
      srtContent += `${segment.text}\n\n`;
    });

    fs.writeFileSync(outputPath, srtContent, 'utf-8');
    console.log(`SRT file created: ${outputPath}`);
  }

  private formatSRTTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const millis = Math.floor((seconds % 1) * 1000);

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(millis).padStart(3, '0')}`;
  }

  private generateMockTranscription(): TranscriptSegment[] {
    // Mock transcription for testing without Whisper
    console.log('Using mock transcription (install Whisper.cpp for real transcription)');
    return [
      { start: 0, end: 3, text: 'Welcome to this video' },
      { start: 3, end: 6, text: 'Today we are going to talk about' },
      { start: 6, end: 9, text: 'something really interesting' },
      { start: 9, end: 12, text: 'Make sure to watch till the end' },
      { start: 12, end: 15, text: 'and subscribe for more content' },
    ];
  }

  async checkWhisperInstalled(): Promise<boolean> {
    return fs.existsSync(this.whisperPath) && fs.existsSync(this.modelPath);
  }
}

export const transcriptionService = new TranscriptionService();

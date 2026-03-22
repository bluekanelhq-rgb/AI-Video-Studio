import OpenAI from 'openai';
import { config } from '../config';

export class AIService {
  private openai: OpenAI | null;
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = !!config.openai.apiKey;
    this.openai = this.isEnabled ? new OpenAI({
      apiKey: config.openai.apiKey,
    }) : null;
  }

  async generateCaption(videoTitle: string, videoDescription: string): Promise<string> {
    if (!this.isEnabled || !this.openai) {
      // Fallback: Generate simple caption from title
      return `${videoTitle} 🎥 #video #content`;
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a social media expert. Generate engaging, short captions for video clips.',
          },
          {
            role: 'user',
            content: `Generate a catchy caption for a video clip titled "${videoTitle}". Description: ${videoDescription}. Keep it under 150 characters and make it engaging for TikTok/Instagram.`,
          },
        ],
        max_tokens: 100,
        temperature: 0.8,
      });

      return response.choices[0]?.message?.content || `${videoTitle} 🎥`;
    } catch (error) {
      console.error('Error generating caption:', error);
      return `${videoTitle} 🎥 #video`;
    }
  }

  async generateHashtags(caption: string, niche: string): Promise<string[]> {
    if (!this.isEnabled || !this.openai) {
      // Fallback: Return generic hashtags
      return ['#viral', '#trending', '#fyp', '#content'];
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'Generate relevant hashtags for social media posts.',
          },
          {
            role: 'user',
            content: `Generate 5-8 relevant hashtags for this caption: "${caption}". Niche: ${niche}. Return only hashtags separated by spaces.`,
          },
        ],
        max_tokens: 50,
        temperature: 0.7,
      });

      const hashtags = response.choices[0]?.message?.content?.split(' ') || [];
      return hashtags.filter((tag) => tag.startsWith('#'));
    } catch (error) {
      console.error('Error generating hashtags:', error);
      return ['#viral', '#trending', '#fyp'];
    }
  }

  async generateHookTitle(videoContent: string): Promise<string> {
    if (!this.isEnabled || !this.openai) {
      // Fallback: Use original content as title
      return videoContent ? videoContent.substring(0, 60) : 'Untitled Video';
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'Create attention-grabbing hook titles for short-form video content.',
          },
          {
            role: 'user',
            content: `Create a hook title for this video content: "${videoContent}". Make it compelling and under 60 characters.`,
          },
        ],
        max_tokens: 30,
        temperature: 0.9,
      });

      return response.choices[0]?.message?.content || (videoContent ? videoContent.substring(0, 60) : 'Untitled Video');
    } catch (error) {
      console.error('Error generating hook title:', error);
      return videoContent ? videoContent.substring(0, 60) : 'Untitled Video';
    }
  }

  async detectHighlights(transcript: string): Promise<Array<{ start: number; end: number; reason: string }>> {
    if (!this.isEnabled || !this.openai) {
      // Fallback: Return empty array (will use default clip segmentation)
      return [];
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'Analyze video transcripts and identify the most engaging moments for short clips.',
          },
          {
            role: 'user',
            content: `Analyze this transcript and identify 3-5 highlight moments that would make great short clips: "${transcript}". Return as JSON array with start_time, end_time, and reason.`,
          },
        ],
        max_tokens: 500,
        temperature: 0.5,
      });

      const content = response.choices[0]?.message?.content || '[]';
      return JSON.parse(content);
    } catch (error) {
      console.error('Error detecting highlights:', error);
      return [];
    }
  }

  isAIEnabled(): boolean {
    return this.isEnabled;
  }
}

export const aiService = new AIService();

import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

interface PostOptions {
  videoPath: string;
  caption: string;
  hashtags: string;
  accessToken: string;
}

export class SocialMediaService {
  async post(platform: string, options: PostOptions): Promise<any> {
    switch (platform) {
      case 'tiktok':
        return this.postToTikTok(options);
      case 'instagram':
        return this.postToInstagram(options);
      case 'facebook':
        return this.postToFacebook(options);
      case 'youtube':
        return this.postToYouTube(options);
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }

  private async postToTikTok(options: PostOptions): Promise<any> {
    try {
      // TikTok API implementation
      const formData = new FormData();
      formData.append('video', fs.createReadStream(options.videoPath));
      formData.append('caption', `${options.caption} ${options.hashtags}`);

      const response = await axios.post(
        'https://open-api.tiktok.com/share/video/upload/',
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            Authorization: `Bearer ${options.accessToken}`,
          },
        }
      );

      return { postId: response.data.share_id, platform: 'tiktok' };
    } catch (error) {
      console.error('TikTok posting error:', error);
      throw error;
    }
  }

  private async postToInstagram(options: PostOptions): Promise<any> {
    try {
      // Instagram Graph API implementation
      // Step 1: Create media container
      const containerResponse = await axios.post(
        `https://graph.instagram.com/me/media`,
        {
          video_url: options.videoPath,
          caption: `${options.caption} ${options.hashtags}`,
          access_token: options.accessToken,
        }
      );

      const containerId = containerResponse.data.id;

      // Step 2: Publish media
      const publishResponse = await axios.post(
        `https://graph.instagram.com/me/media_publish`,
        {
          creation_id: containerId,
          access_token: options.accessToken,
        }
      );

      return { postId: publishResponse.data.id, platform: 'instagram' };
    } catch (error) {
      console.error('Instagram posting error:', error);
      throw error;
    }
  }

  private async postToFacebook(options: PostOptions): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('source', fs.createReadStream(options.videoPath));
      formData.append('description', `${options.caption} ${options.hashtags}`);
      formData.append('access_token', options.accessToken);

      const response = await axios.post(
        'https://graph.facebook.com/me/videos',
        formData,
        {
          headers: formData.getHeaders(),
        }
      );

      return { postId: response.data.id, platform: 'facebook' };
    } catch (error) {
      console.error('Facebook posting error:', error);
      throw error;
    }
  }

  private async postToYouTube(options: PostOptions): Promise<any> {
    try {
      // YouTube Data API implementation for Shorts
      const response = await axios.post(
        'https://www.googleapis.com/upload/youtube/v3/videos',
        {
          snippet: {
            title: options.caption.substring(0, 100),
            description: `${options.caption}\n\n${options.hashtags}`,
            categoryId: '22',
          },
          status: {
            privacyStatus: 'public',
          },
        },
        {
          headers: {
            Authorization: `Bearer ${options.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return { postId: response.data.id, platform: 'youtube' };
    } catch (error) {
      console.error('YouTube posting error:', error);
      throw error;
    }
  }
}

export const socialMediaService = new SocialMediaService();

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const api = {
  // Channels
  async addChannel(channelUrl: string) {
    const response = await fetch(`${API_URL}/channels/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ channelUrl }),
    });
    return response.json();
  },

  async getChannels() {
    const response = await fetch(`${API_URL}/channels`, {
      credentials: 'include',
    });
    return response.json();
  },

  async toggleMonitoring(channelId: number, monitoring: boolean) {
    const response = await fetch(`${API_URL}/channels/${channelId}/monitoring`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ monitoring }),
    });
    return response.json();
  },

  // Videos
  async processVideo(videoUrl: string) {
    const response = await fetch(`${API_URL}/video/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ videoUrl }),
    });
    return response.json();
  },

  async getVideo(videoId: number) {
    const response = await fetch(`${API_URL}/video/${videoId}`, {
      credentials: 'include',
    });
    return response.json();
  },

  // Clips
  async getClips(status?: string) {
    const url = status 
      ? `${API_URL}/clips?status=${status}`
      : `${API_URL}/clips`;
    const response = await fetch(url, {
      credentials: 'include',
    });
    return response.json();
  },

  async getClip(clipId: number) {
    const response = await fetch(`${API_URL}/clips/${clipId}`, {
      credentials: 'include',
    });
    return response.json();
  },

  async updateClip(clipId: number, data: { title?: string; caption?: string; hashtags?: string }) {
    const response = await fetch(`${API_URL}/clips/${clipId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async publishClip(clipId: number, platforms: string[], scheduledFor?: string) {
    const response = await fetch(`${API_URL}/clips/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ clipId, platforms, scheduledFor }),
    });
    return response.json();
  },

  async getClipQueue() {
    const response = await fetch(`${API_URL}/clips/queue`, {
      credentials: 'include',
    });
    return response.json();
  },

  async updateQueueItem(queueId: number, data: { scheduledFor?: string; platforms?: string[] }) {
    const response = await fetch(`${API_URL}/clips/queue/${queueId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async deleteQueueItem(queueId: number) {
    const response = await fetch(`${API_URL}/clips/queue/${queueId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    return response.json();
  },

  async publishQueueItemNow(queueId: number) {
    const response = await fetch(`${API_URL}/clips/queue/${queueId}/publish`, {
      method: 'POST',
      credentials: 'include',
    });
    return response.json();
  },

  async deleteClip(clipId: number) {
    const response = await fetch(`${API_URL}/clips/${clipId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    return response.json();
  },

  async generateClipCaption(clipId: number) {
    const response = await fetch(`${API_URL}/clips/${clipId}/caption`, {
      method: 'POST',
      credentials: 'include',
    });
    return response.json();
  },

  async applyClipStyle(clipId: number, style: string) {
    const response = await fetch(`${API_URL}/clips/${clipId}/style`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ style }),
    });
    return response.json();
  },

  // Social Media
  async connectSocialAccount(data: any) {
    const response = await fetch(`${API_URL}/social/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async getSocialAccounts() {
    const response = await fetch(`${API_URL}/social/accounts`, {
      credentials: 'include',
    });
    return response.json();
  },

  async disconnectSocialAccount(accountId: number) {
    const response = await fetch(`${API_URL}/social/accounts/${accountId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    return response.json();
  },

  // Delete channel
  async deleteChannel(channelId: number) {
    const response = await fetch(`${API_URL}/channels/${channelId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    return response.json();
  },

  // My Videos
  async getMyVideos() {
    const response = await fetch(`${API_URL}/my-videos`, {
      credentials: 'include',
    });
    return response.json();
  },

  async uploadMyVideo(formData: FormData) {
    const response = await fetch(`${API_URL}/my-videos/upload`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }
    
    return response.json();
  },

  async transcribeVideo(videoId: number) {
    const response = await fetch(`${API_URL}/my-videos/${videoId}/transcribe`, {
      method: 'POST',
      credentials: 'include',
    });
    return response.json();
  },

  async generateVideoCaption(videoId: number) {
    const response = await fetch(`${API_URL}/my-videos/${videoId}/caption`, {
      method: 'POST',
      credentials: 'include',
    });
    return response.json();
  },

  async applyVideoStyle(videoId: number, style: string) {
    const response = await fetch(`${API_URL}/my-videos/${videoId}/style`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ style }),
    });
    return response.json();
  },

  async deleteMyVideo(videoId: number) {
    const response = await fetch(`${API_URL}/my-videos/${videoId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    return response.json();
  },

  async addMyVideoToQueue(videoId: number, platforms: string[], scheduledFor?: string) {
    const response = await fetch(`${API_URL}/my-videos/${videoId}/queue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ platforms, scheduledFor }),
    });
    return response.json();
  },

  // Dashboard
  async getDashboardStats() {
    const response = await fetch(`${API_URL}/dashboard/stats`, {
      credentials: 'include',
    });
    return response.json();
  },
};

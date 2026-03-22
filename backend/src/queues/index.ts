import { Queue, QueueOptions } from 'bullmq';
import { config } from '../config';

const connection = {
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
};

const defaultJobOptions: QueueOptions['defaultJobOptions'] = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000,
  },
  removeOnComplete: {
    count: 100,
    age: 24 * 3600,
  },
  removeOnFail: {
    count: 500,
  },
};

// Video download queue
export const videoDownloadQueue = new Queue('video-download', {
  connection,
  defaultJobOptions,
});

// Clip generation queue
export const clipGenerationQueue = new Queue('clip-generation', {
  connection,
  defaultJobOptions,
});

// AI processing queue
export const aiProcessingQueue = new Queue('ai-processing', {
  connection,
  defaultJobOptions,
});

// Caption generation queue
export const captionQueue = new Queue('caption-generation', {
  connection,
  defaultJobOptions,
});

// Social media posting queue
export const postingQueue = new Queue('social-posting', {
  connection,
  defaultJobOptions: {
    ...defaultJobOptions,
    attempts: 5,
  },
});

// Live stream monitoring queue
export const liveStreamQueue = new Queue('live-stream-monitor', {
  connection,
  defaultJobOptions,
});

export const queues = {
  videoDownload: videoDownloadQueue,
  clipGeneration: clipGenerationQueue,
  aiProcessing: aiProcessingQueue,
  caption: captionQueue,
  posting: postingQueue,
  liveStream: liveStreamQueue,
};

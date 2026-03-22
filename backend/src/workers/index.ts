import { videoDownloadWorker } from './video-download.worker';
import { clipGenerationWorker } from './clip-generation.worker';
import { aiProcessingWorker } from './ai-processing.worker';
import { postingWorker } from './posting.worker';
import { liveStreamMonitorWorker } from './livestream-monitor.worker';

console.log('Starting workers...');

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing workers...');
  await Promise.all([
    videoDownloadWorker.close(),
    clipGenerationWorker.close(),
    aiProcessingWorker.close(),
    postingWorker.close(),
    liveStreamMonitorWorker.close(),
  ]);
  process.exit(0);
});

console.log('All workers started successfully');

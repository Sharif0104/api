const { Queue, Worker } = require('bullmq');
const redis = require('redis');

const connection = {
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
  password: process.env.REDIS_PASSWORD,
};

const jobQueue = new Queue('jobQueue', { connection });

// Add retry and dead-letter queue logic to BullMQ jobs
const addTask = async (data) => {
  const job = await jobQueue.add('task', data, {
    attempts: 5, // Retry up to 5 times
    backoff: {
      type: 'exponential',
      delay: 1000 // 1s, then 2s, 4s, etc.
    },
    removeOnFail: false, // Keep failed jobs for dead-letter queue
    failedReason: 'Moved to dead-letter queue after max retries'
  });
  return job.id;
};

const getStatus = async (jobId) => {
  const job = await jobQueue.getJob(jobId);
  if (!job) return { status: 'not found' };
  return { status: job.getState(), progress: job.progress }; 
};

const worker = new Worker('jobQueue', async (job) => {
  console.log(`Processing job ${job.id} with data:`, job.data);
  // Add your job processing logic here
}, { connection });

// Dead-letter queue worker (logs failed jobs)
const deadLetterWorker = new Worker('jobQueue', async (job) => {
  if (job.attemptsMade >= 5 && job.failedReason) {
    console.error(`Job ${job.id} moved to dead-letter queue:`, job.data);
    // Optionally: move to a separate queue or notify admin
  }
}, { connection, autorun: false });

module.exports = { addTask, getStatus };

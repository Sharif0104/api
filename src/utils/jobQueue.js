const { Queue, Worker } = require('bullmq');
const redis = require('redis');

const connection = {
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
  password: process.env.REDIS_PASSWORD,
};

const jobQueue = new Queue('jobQueue', { connection });

const addTask = async (data) => {
  const job = await jobQueue.add('task', data);
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

module.exports = { addTask, getStatus };

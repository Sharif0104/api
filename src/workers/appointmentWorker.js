require('dotenv').config();
const { Worker } = require('bullmq');
const prisma = require('../utils/prisma');
const connection = { host: process.env.REDIS_HOST, port: Number(process.env.REDIS_PORT), password: process.env.REDIS_PASSWORD, maxRetriesPerRequest: null };

exports.startAppointmentWorker = () => {
  const worker = new Worker('appointments', async job => {
    const { userId, shopId, date, hour, availabilityId } = job.data;
    try {
      const existingBooking = await prisma.booking.findFirst({
        where: { shopId, date: new Date(date), hour }
      });

      if (existingBooking) {
        console.log(`Job ${job.id} skipped: Time slot already booked.`);
        return;
      }

      await prisma.booking.create({
        data: {
          userId,
          shopId,
          date: new Date(date),
          hour,
          availabilityId
        }
      });
      console.log(`Job ${job.id} done`);
    } catch (err) {
      console.error(`Job ${job.id} failed`, err);
    }
  }, { connection });

  worker.on('completed', job => console.log(`Job ${job.id} done`));
  worker.on('failed', (job, err) => console.error(`Job ${job.id} failed`, err));

  // Graceful shutdown support
  const shutdown = async () => {
    try {
      await worker.close();
      console.log('Appointment worker closed.');
    } catch (err) {
      console.error('Error closing appointment worker:', err);
    }
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  // Export for external shutdown if needed
  return worker;
};

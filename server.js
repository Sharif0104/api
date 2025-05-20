require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const socketIo = require("socket.io");
const { applySecurity } = require('./src/middleware/security');
const apiRoutes = require("./src/routes/apiRoutes");
const shopRoutes = require("./src/routes/shopRoutes");
const availabilityRoutes = require("./src/routes/availabilityRoutes");
const appointmentRoutes = require("./src/routes/appointmentRoutes");
const timeSlotRoutes = require("./src/routes/timeSlotRoutes");
const userRoutes = require("./src/routes/userRoutes");
const authRoutes = require("./src/routes/authRoutes");
const minecraftRoutes = require("./src/routes/minecraftRoutes");
const speedTestRouter = require("./src/routes/speedTestRouter");
const notificationsRouter = require("./src/routes/notificationsRoutes");
const UploadRoutes = require("./src/routes/UploadRoutes");
const friendRoutes = require("./src/routes/friendRoutes");
const messageRoutes = require("./src/routes/messageRoutes");
const nodemailer = require("nodemailer");

const sequelize = require('./src/config/db');
const path = require('path');
const redis = require("redis");
const { swaggerUi, swaggerSpec } = require('./src/config/swagger');
const { register, httpRequestCounter, httpRequestDuration } = require('./src/utils/metrics');

const orderRoutes = require('./src/routes/orderRoutes');
const productRoutes = require("./src/routes/productRoutes");
const contactRoutes = require("./src/routes/contactRoutes");
const searchRoutes = require('./src/routes/searchRoutes');
const inventoryRoutes = require('./src/routes/inventoryRoutes');
const auditRoutes = require('./src/routes/auditRoutes');
// const farmInventoryRoutes = require("./src/routes/farmInventoryRoutes"); // REMOVED: use /inventory for both shop and farm inventory

const logStream = fs.createWriteStream('app.log', { flags: 'a' });

console.log = function (message) {
  logStream.write(`${new Date().toISOString()} - ${message}\n`);
  process.stdout.write(`${new Date().toISOString()} - ${message}\n`);
};

console.error = function (message) {
  logStream.write(`${new Date().toISOString()} - ERROR: ${message}\n`);
  process.stderr.write(`${new Date().toISOString()} - ERROR: ${message}\n`);
};

const app = express();
app.set('trust proxy', 1); // Trust first proxy (fixes X-Forwarded-For warning)

// Import corsMiddleware at the top
const { corsMiddleware } = require('./src/middleware/corsMiddleware');
const allowedOrigins = [
  "https://sharifwebz.xyz",
];
const cookieParser = require("cookie-parser");
const { hppMiddleware } = require('./src/middleware/hppMiddleware');
const { validateApiKey } = require('./src/middleware/apiKeyMiddleware');
const helmet = require('./src/middleware/helmetMiddleware');
const rateLimiter = require('./src/middleware/rateLimiter');
const { maintenanceMiddleware } = require('./src/middleware/maintenanceMiddleware');
const urlParameterMiddleware = require('./src/middleware/urlParameterMiddleware');

// --- MOVE CORS MIDDLEWARE TO THE VERY TOP ---
app.use(corsMiddleware);
// -------------------------------------------

// Enable cookie parsing for CSRF token handling
app.use(cookieParser());

// Disable CSRF for specific routes
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: true });

// Professional: Expose a CSRF token endpoint for API clients
app.get('/api/v1/auth/csrf', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Professional: Add robust CSRF error logging and response
app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    console.error('CSRF error:', {
      url: req.originalUrl,
      headers: req.headers,
      cookies: req.cookies,
      body: req.body,
    });
    return res.status(403).json({ message: 'Invalid CSRF token' });
  }
  next(err);
});

// Move /csrf-token route after CORS middleware
// Route to provide CSRF token to clients
app.get("/csrf-token", csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Move express.json() middleware to ensure it is applied before route definitions
app.use(express.json());

// Public static serving for uploads/public (public images)
app.use('/uploads/public', express.static(path.join(__dirname, 'uploads/public')));

// Remove public static serving for uploads/files and images
// app.use('/uploads/files', express.static(path.join(__dirname, 'uploads/files')));
// app.use('/api/v1/upload/images', express.static('uploads/images'));

// Secure file download endpoint (private images)
const auth = require('./src/middleware/auth');
app.get('/uploads/files/:filename', auth, (req, res) => {
  const filePath = path.join(__dirname, 'uploads/files', req.params.filename);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send({ message: 'File not found' });
  }
});

// Secure image download endpoint (private images)
app.get('/api/v1/upload/images/:imageId', auth, (req, res) => {
  const { imageId } = req.params;
  const imagePath = path.join(__dirname, 'uploads/images', imageId);

  client.get(imageId, (err, cachedImage) => {
    if (cachedImage) {
      res.set('Content-Type', 'image/png');
      return res.send(cachedImage);
    }

    fs.readFile(imagePath, (err, imageBuffer) => {
      if (err) return res.status(404).send('Image not found');
      client.setex(imageId, 3600, imageBuffer);
      res.set('Content-Type', 'image/png');
      res.send(imageBuffer);
    });
  });
});

// FIX: Mount routers at unique base paths to avoid conflicts
app.use('/api/v1', apiRoutes);
app.use('/api/v1/search', searchRoutes);
app.use('/api/v1/inventory', inventoryRoutes);

// Apply middleware
app.use(corsMiddleware);
app.use(hppMiddleware);
app.use(maintenanceMiddleware);
app.use(urlParameterMiddleware); // Professional URL parameter handler

// Only apply API key and CSRF middleware if not in test environment
if (process.env.NODE_ENV !== 'test') {
  app.use(validateApiKey);
  app.use((req, res, next) => {
    if (req.path.startsWith('/cache/image')) {
      return next();
    }
    csrfProtection(req, res, next);
  });
}

app.use(helmet);
app.use(rateLimiter);

// Metrics middleware
app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer({ method: req.method, route: req.path });
  res.on('finish', () => {
    httpRequestCounter.inc({ method: req.method, route: req.path, status_code: res.statusCode });
    end({ status_code: res.statusCode });
  });
  next();
});

// Expose /metrics endpoint for Prometheus
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

sequelize.authenticate()
  .then(() => console.log('Database connected'))
  .catch(err => console.log('Error:', err));

// Remove or update app.options to use custom CORS middleware
app.options("*", corsMiddleware);

app.use((req, res, next) => {
  next();
});

app.use((req, res, next) => {
  console.log('Middleware executed for:', req.method, req.path);
  next();
});

applySecurity(app);

// Define protected API routes
app.use('/api/v1/shops', shopRoutes);
app.use('/api/v1/shops/availability', availabilityRoutes);
app.use('/api/v1/shops/timeslots', timeSlotRoutes);
app.use('/api/v1/appointments', appointmentRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/minecraft', minecraftRoutes);
app.use('/api/v1/speedtest', speedTestRouter);
app.use('/api/v1/upload', UploadRoutes);
app.use('/api/v1/notifications', notificationsRouter);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/friends', friendRoutes);
app.use('/api/v1/messages', messageRoutes);
app.use('/api/v1/contact', contactRoutes);
app.use('/api/v1/audit', auditRoutes);
// app.use("/api/farminventories", farmInventoryRoutes); // REMOVED: use /inventory for both shop and farm inventory

const client = redis.createClient({
  url: `redis://:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
});
let appointmentWorker;
try {
  const { startAppointmentWorker } = require('./src/workers/appointmentWorker');
  appointmentWorker = startAppointmentWorker();
} catch (e) {
  console.error('Could not start appointment worker:', e);
}

const cluster = require('cluster');
const os = require('os');

if (cluster.isMaster) {
  // Limit to 2 workers for WSL2/Windows 10 stability
  const numCPUs = Math.min(os.cpus().length, 2);
  console.log(`Master process ${process.pid} is running. Forking ${numCPUs} workers...`);
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died. Forking a new worker...`);
    cluster.fork();
  });
} else {
  if (require.main === module) {
    // Use HTTP server if SSL is not required
    const server = app.listen(process.env.PORT, () => {
      console.log(`Worker ${process.pid} running on port ${process.env.PORT}`);
    });
    const io = socketIo(server, {
      cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
      }
    });
    io.on("connection", (socket) => {
      console.log("A user connected");
      socket.on("disconnect", () => {
        console.log("User disconnected");
      });
      socket.on("chat_message", (msg) => {
        io.emit("chat_message", msg);
      });
    });
    // --- Graceful Shutdown Implementation ---
    const shutdown = async () => {
      console.log('Received shutdown signal, closing server and resources...');
      server.close(() => {
        console.log('HTTP server closed.');
        // Close DB connection
        if (sequelize && sequelize.close) {
          sequelize.close().then(() => {
            console.log('Database connection closed.');
          });
        }
      });
      // Close Redis
      if (client && client.quit) {
        client.quit(() => console.log('Redis client closed.'));
      }
      // Close BullMQ worker
      if (appointmentWorker && appointmentWorker.close) {
        try {
          await appointmentWorker.close();
          console.log('Appointment worker closed.');
        } catch (err) {
          console.error('Error closing appointment worker:', err);
        }
      }
      // Force exit if not closed in 10s
      setTimeout(() => {
        console.error('Force exiting after 10s.');
        process.exit(1);
      }, 10000);
    };
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
    // --- End Graceful Shutdown ---
  }
}

const errorHandler = require('./src/middleware/errorHandler');
app.use(errorHandler);

// Export the app for testing and integration
module.exports = app;
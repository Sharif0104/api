require("dotenv").config();
const express = require("express");
const cors = require("cors");
const https = require("https");
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

const orderRoutes = require('./src/routes/orderRoutes');
const productRoutes = require("./src/routes/productRoutes");
const contactRoutes = require("./src/routes/contactRoutes");
const searchRoutes = require('./src/routes/searchRoutes');
const inventoryRoutes = require('./src/routes/inventoryRoutes');

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
const sslOptions = {
  key: fs.readFileSync("/etc/letsencrypt/live/play.sharifwebz.xyz/privkey.pem"),
  cert: fs.readFileSync("/etc/letsencrypt/live/play.sharifwebz.xyz/fullchain.pem"),
};
const allowedOrigins = [
  "http://209.25.142.16:1966",
  "https://play.sharifwebz.xyz:1966",
  "http://192.168.1.33:1966",
  "https://sharifwebz.xyz"
];

const { startAppointmentWorker } = require('./src/workers/appointmentWorker');
startAppointmentWorker();

const client = redis.createClient({
  url: `redis://:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
});
client.connect().catch(console.error);

app.set("trust proxy", 1);

const { maintenanceMiddleware } = require('./src/middleware/maintenanceMiddleware');
const { corsMiddleware } = require('./src/middleware/corsMiddleware');
const { hppMiddleware } = require('./src/middleware/hppMiddleware');
const { rateLimiter } = require('./src/middleware/rateLimiterMiddleware');
const { helmet } = require('./src/middleware/helmetMiddleware');
const { validateApiKey } = require('./src/middleware/apiKeyMiddleware');

const csurf = require("csurf");
const cookieParser = require("cookie-parser");

const morgan = require("morgan");
const compression = require("compression");
const { body, validationResult } = require("express-validator");

// Enable HTTP request logging with Morgan
app.use(morgan("combined"));

// Enable Gzip compression for responses
app.use(compression());

// Example usage of express-validator for input validation
// app.post('/example', [
//   body('email').isEmail(),
//   body('password').isLength({ min: 5 })
// ], (req, res) => {
//   const errors = validationResult(req);
//   if (!errors.isEmpty()) {
//     return res.status(400).json({ errors: errors.array() });
//   }
//   res.send('Input is valid');
// });

// Enable cookie parsing for CSRF token handling
app.use(cookieParser());

// Disable CSRF for specific routes
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: true });

// Apply CSRF protection to all routes except image caching
app.use((req, res, next) => {
  if (req.path.startsWith('/cache/image')) {
    return next(); // Skip CSRF for image caching routes
  }
  csrfProtection(req, res, next);
});

// Route to provide CSRF token to clients
app.get("/csrf-token", (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Move express.json() middleware to ensure it is applied before route definitions
app.use(express.json());

// Public routes that don't require middleware
app.use('/uploads/files', express.static(path.join(__dirname, 'uploads/files')));
app.use('/api/upload/images', express.static('uploads/images'));
app.use('/', apiRoutes);
app.use('/', searchRoutes);
app.use('/', inventoryRoutes);

// Apply middleware
app.use(corsMiddleware);
app.use(hppMiddleware);
app.use(validateApiKey);
app.use(helmet);
app.use(rateLimiter);
app.use(maintenanceMiddleware);

sequelize.authenticate()
  .then(() => console.log('Database connected'))
  .catch(err => console.log('Error:', err));

app.options("*", cors());

app.use((req, res, next) => {
  next();
});

app.use((req, res, next) => {
  console.log('Middleware executed for:', req.method, req.path);
  next();
});

applySecurity(app);

// Define protected API routes
app.use('/api/shops', shopRoutes);
app.use('/api/shops/availability', availabilityRoutes);
app.use('/api/shops/timeslots', timeSlotRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/minecraft', minecraftRoutes);
app.use('/api/speedtest', speedTestRouter);
app.use('/api/upload', UploadRoutes);
app.use('/notifications', notificationsRouter);
app.use('/api', orderRoutes);
app.use("/api", productRoutes);
app.use("/friends", friendRoutes);
app.use("/messages", messageRoutes);
app.use("/api", contactRoutes);

app.get('/api/upload/images/:imageId', (req, res) => {
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

const server = https.createServer(sslOptions, app);

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

server.listen(process.env.PORT, () =>
  console.log(`Server running on port ${process.env.PORT}`)
);
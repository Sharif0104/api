const cors = require("cors");

const allowedOrigins = [
  "http://209.25.142.16:1966",
  "https://play.sharifwebz.xyz:1966",
  "http://192.168.1.33:1966",
  "https://sharifwebz.xyz",
];

const corsMiddleware = cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-api-key"],
  credentials: true,
});

module.exports = { corsMiddleware };

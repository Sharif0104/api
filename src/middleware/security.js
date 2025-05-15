const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

exports.applySecurity = (app) => {
  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false
  }));

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many requests from this IP, please try again later."
  });
  app.use(limiter);

  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
    next();
  });
};

const { RateLimiterMemory } = require('rate-limiter-flexible');

// Per-user rate limiter: 20 requests per 15 minutes
const userRateLimiter = new RateLimiterMemory({
  points: 20, // Number of requests
  duration: 900, // Per 15 minutes
});

async function perUserRateLimit(req, res, next) {
  // Use user ID if authenticated, else IP
  const key = req.user?.id ? `user_${req.user.id}` : req.ip;
  try {
    await userRateLimiter.consume(key);
    next();
  } catch (rejRes) {
    res.status(429).json({ message: 'Too many requests (per user), please try again later.' });
  }
}

module.exports = perUserRateLimit;

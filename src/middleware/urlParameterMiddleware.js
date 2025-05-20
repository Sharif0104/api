// Professional middleware for URL parameter handling: tracking, access control, caching, context
const logger = require('../utils/logger');

module.exports = function urlParameterMiddleware(req, res, next) {
  // --- Tracking ---
  const tracking = {
    utm_source: req.query.utm_source,
    utm_medium: req.query.utm_medium,
    utm_campaign: req.query.utm_campaign
  };
  if (tracking.utm_source || tracking.utm_medium || tracking.utm_campaign) {
    logger.info({
      event: 'tracking',
      ...tracking,
      path: req.path,
      user: req.user?.id || null,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });
  }

  // --- Access Control (temporary token/role) ---
  if (req.query.token) {
    // Example: Attach token to request for downstream validation
    req.accessToken = req.query.token;
  }
  if (req.query.role) {
    req.requestedRole = req.query.role;
  }

  // --- Caching ---
  req.cacheControl = {
    cache: req.query.cache !== undefined ? req.query.cache === 'true' : undefined,
    cacheKey: req.query.cacheKey
  };

  // --- Context ---
  req.context = {
    lang: req.query.lang,
    theme: req.query.theme,
    context: req.query.context
  };

  next();
};

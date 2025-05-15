const helmet = require('helmet');

module.exports = helmet({
  contentSecurityPolicy: false, // Disable if not needed
  crossOriginEmbedderPolicy: true,
  crossOriginResourcePolicy: { policy: "same-origin" },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: "deny" },
  hidePoweredBy: true,
  hsts: { maxAge: 31536000, includeSubDomains: true },
  ieNoOpen: true,
  noSniff: true,
  xssFilter: true
});
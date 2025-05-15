const os = require('os');
const prisma = require('../utils/prisma');
const startTime = Date.now();
const process = require('process');
const path = require('path');
const fs = require('fs');
const tls = require('tls');
const { isMaintenanceMode, setMaintenanceMode } = require('../middleware/maintenanceMiddleware');
const cache = require('../utils/cache');
const jobQueue = require('../utils/jobQueue');
const logger = require('../utils/logger');

// Function to get the health status of the application
exports.getHealthStatus = (req, res) => {
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();

  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(uptime)} seconds`,
    memory: {
      rss: memoryUsage.rss,
      heapTotal: memoryUsage.heapTotal,
      heapUsed: memoryUsage.heapUsed,
      external: memoryUsage.external,
    },
    cpuLoad: os.loadavg(),
    platform: os.platform(),
    arch: os.arch(),
  });
};

// Function to check if the application is alive
exports.getLivenessProbe = (req, res) => {
    res.status(200).json({
      status: 'alive',
      timestamp: new Date().toISOString(),
    });
};

// Function to check if the application is ready to serve requests
exports.getReadinessProbe = async (req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`; // DB check
      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Readiness check failed:', error);
      res.status(503).json({
        status: 'unavailable',
        error: 'Database connection failed',
        timestamp: new Date().toISOString(),
      });
    }
};

// Function to get the system status including uptime, memory, and load average
exports.getSystemStatus = async (req, res) => {
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();
  const loadAverage = os.loadavg();

  try {
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: `${Math.floor(uptime)}s`,
      memory: {
        rss: memoryUsage.rss,
        heapTotal: memoryUsage.heapTotal,
        heapUsed: memoryUsage.heapUsed,
        external: memoryUsage.external,
      },
      loadAverage: loadAverage,
      dependencies: {
        database: 'connected',
      },
    });
  } catch (error) {
    res.status(503).json({
      status: 'degraded',
      timestamp: new Date().toISOString(),
      uptime: `${Math.floor(uptime)}s`,
      dependencies: {
        database: 'unreachable',
      },
      error: 'Failed to connect to database',
    });
  }
};

// Function to get application metrics
exports.getMetrics = (req, res) => {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    const loadAverage = os.loadavg();
    const uptime = process.uptime();
  
    const metrics = {
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(uptime),
      memory: {
        rss: memoryUsage.rss,
        heapTotal: memoryUsage.heapTotal,
        heapUsed: memoryUsage.heapUsed,
        external: memoryUsage.external,
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
      },
      loadAverage: {
        '1m': loadAverage[0],
        '5m': loadAverage[1],
        '15m': loadAverage[2],
      },
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
    };
  
    res.status(200).json(metrics);
};

// Function to get application information from package.json
exports.getAppInfo = (req, res) => {
    try {
      const packageJsonPath = path.resolve(__dirname, '../../package.json');
      const packageData = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  
      const info = {
        name: packageData.name,
        version: packageData.version,
        description: packageData.description,
        author: packageData.author,
        license: packageData.license,
        timestamp: new Date().toISOString(),
      };
  
      res.status(200).json(info);
    } catch (error) {
      console.error('Failed to load application info:', error);
      res.status(500).json({ message: 'Could not retrieve application info' });
    }
};

// Function to get the application version
exports.getVersion = (req, res) => {
    try {
      const packageJsonPath = path.resolve(__dirname, '../../package.json');
      const packageData = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  
      res.status(200).json({ version: packageData.version });
    } catch (error) {
      console.error('Error retrieving version:', error);
      res.status(500).json({ message: 'Unable to fetch version information' });
    }
};

// Function to check the database connection health
exports.checkDatabase = async (req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.status(200).json({ status: 'ok', message: 'Database connection is healthy' });
    } catch (error) {
      console.error('Database health check failed:', error);
      res.status(500).json({ status: 'error', message: 'Database connection failed' });
    }
};

// Function to check security configurations
exports.checkSecurity = (req, res) => {
    const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';
  
    const hasSecurityHeaders = [
      'strict-transport-security',
      'x-content-type-options',
      'x-frame-options',
      'x-xss-protection'
    ].every(header => res.getHeader(header));
  
    const isAuthEnabled = !!req.headers.authorization;
  
    if (isHttps && hasSecurityHeaders && isAuthEnabled) {
      return res.status(200).json({
        status: 'ok',
        message: 'Security features are properly configured'
      });
    }
  
    res.status(500).json({
      status: 'error',
      message: 'Security misconfiguration detected',
      details: {
        https: isHttps,
        securityHeaders: hasSecurityHeaders,
        authHeaderPresent: isAuthEnabled
      }
    });
};

// Function to check SSL/TLS certificates for domains
exports.checkCertificates = async (req, res) => {
    const domain = process.env.DOMAIN;
    const port = parseInt(process.env.PORT, 10);

    const domains = req.query.domains
      ? req.query.domains.split(',').map((d) => d.trim())
      : [domain];
  
    const results = await Promise.all(
      domains.map((domain) => {
        return new Promise((resolve) => {
          const socket = tls.connect(
            {
              host: domain,
              port: port,
              servername: domain,
              rejectUnauthorized: true,
            },
            () => {
              const cert = socket.getPeerCertificate();
              socket.end();
  
              if (cert && cert.valid_to) {
                const validTo = new Date(cert.valid_to);
                const daysRemaining = Math.floor(
                  (validTo - new Date()) / (1000 * 60 * 60 * 24)
                );
  
                resolve({
                  domain,
                  valid: true,
                  valid_from: cert.valid_from,
                  valid_to: cert.valid_to,
                  days_remaining: daysRemaining,
                });
              } else {
                resolve({
                  domain,
                  valid: false,
                  error: 'No certificate information available',
                });
              }
            }
          );
  
          socket.on('error', (err) => {
            resolve({
              domain,
              valid: false,
              error: err.message,
            });
          });
        });
      })
    );
  
    res.status(200).json(results);
};

exports.startMaintenance = (req, res) => {
  setMaintenanceMode(true);
  res.status(200).json({
    message: "Maintenance mode started",
    timestamp: new Date().toISOString(),
  });
};

exports.stopMaintenance = (req, res) => {
  setMaintenanceMode(false);
  res.status(200).json({
    message: "Maintenance mode stopped",
    timestamp: new Date().toISOString(),
  });
};

// Add new functions for cache management, job queue, and audit logging
// Enhance cache management with selective clearing and expiration policies
exports.clearCache = async (req, res) => {
  try {
    const { key } = req.query;
    if (key) {
      await client.del(key); // Clear specific key
      res.status(200).json({ message: `Cache cleared for key: ${key}` });
    } else {
      await client.flushAll(); // Clear all keys
      res.status(200).json({ message: 'All cache cleared successfully' });
    }
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({ error: 'Failed to clear cache' });
  }
};

exports.setCache = async (key, value, expiration) => {
  try {
    if (expiration) {
      await client.setEx(key, expiration, JSON.stringify(value)); // Set key with expiration
    } else {
      await client.set(key, JSON.stringify(value)); // Set key without expiration
    }
  } catch (error) {
    console.error('Error setting cache:', error);
    throw error;
  }
};

exports.getCache = async (key) => {
  try {
    const value = await client.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error('Error getting cache:', error);
    throw error;
  }
};

exports.queueBackgroundTask = async (req, res) => {
  try {
    const taskId = await jobQueue.addTask(req.body);
    res.status(200).json({ message: 'Task queued successfully', taskId });
  } catch (error) {
    console.error('Error queuing task:', error);
    res.status(500).json({ error: 'Failed to queue task' });
  }
};

exports.getJobStatus = async (req, res) => {
  try {
    const status = await jobQueue.getStatus(req.params.id);
    res.status(200).json({ status });
  } catch (error) {
    console.error('Error fetching job status:', error);
    res.status(500).json({ error: 'Failed to fetch job status' });
  }
};

exports.getLogs = async (req, res) => {
  try {
    const logs = await logger.getLogs();
    res.status(200).json(logs);
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
};

exports.getAuditHistory = async (req, res) => {
  try {
    const auditHistory = await logger.getAuditHistory();
    res.status(200).json(auditHistory);
  } catch (error) {
    console.error('Error fetching audit history:', error);
    res.status(500).json({ error: 'Failed to fetch audit history' });
  }
};

// Add functions for image caching
exports.cacheImageMetadata = async (req, res) => {
  try {
    const { key, metadata, expiration } = req.body;
    if (!key || !metadata) {
      return res.status(400).json({ error: 'Key and metadata are required' });
    }
    await client.setEx(key, expiration || 3600, JSON.stringify(metadata)); // Cache metadata with expiration
    res.status(200).json({ message: 'Image metadata cached successfully' });
  } catch (error) {
    console.error('Error caching image metadata:', error);
    res.status(500).json({ error: 'Failed to cache image metadata' });
  }
};

exports.getCachedImageMetadata = async (req, res) => {
  try {
    const { key } = req.params;
    const metadata = await client.get(key);
    if (!metadata) {
      return res.status(404).json({ error: 'Metadata not found' });
    }
    res.status(200).json(JSON.parse(metadata));
  } catch (error) {
    console.error('Error retrieving image metadata:', error);
    res.status(500).json({ error: 'Failed to retrieve image metadata' });
  }
};

exports.cacheImageData = async (req, res) => {
  try {
    const { key, imageData, expiration } = req.body;
    if (!key || !imageData) {
      return res.status(400).json({ error: 'Key and image data are required' });
    }
    await client.setEx(key, expiration || 3600, imageData); // Cache image data with expiration
    res.status(200).json({ message: 'Image data cached successfully' });
  } catch (error) {
    console.error('Error caching image data:', error);
    res.status(500).json({ error: 'Failed to cache image data' });
  }
};

exports.getCachedImageData = async (req, res) => {
  try {
    const { key } = req.params;
    const imageData = await client.get(key);
    if (!imageData) {
      return res.status(404).json({ error: 'Image data not found' });
    }
    res.status(200).send(imageData); // Return raw image data
  } catch (error) {
    console.error('Error retrieving image data:', error);
    res.status(500).json({ error: 'Failed to retrieve image data' });
  }
};
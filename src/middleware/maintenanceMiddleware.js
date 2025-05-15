let isMaintenanceMode = false;

const maintenanceMiddleware = (req, res, next) => {
  // Allow the /maintenance/stop endpoint to bypass maintenance mode
  if (req.method === 'POST' && req.path === '/maintenance/stop') {
    return next();
  }

  if (isMaintenanceMode) {
    return res.status(503).json({
      message: "The server is currently in maintenance mode. Please try again later.",
      timestamp: new Date().toISOString(),
    });
  }
  next();
};

const setMaintenanceMode = (value) => {
  isMaintenanceMode = value;
  console.log(`Maintenance mode set to: ${isMaintenanceMode}`);
};

module.exports = { maintenanceMiddleware, setMaintenanceMode };

// Centralized error handling middleware
module.exports = (err, req, res, next) => {
  // Log the error (could be enhanced with winston or similar)
  console.error(err.stack || err);

  // Customize error response
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    // Optionally include stack trace in development
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
};

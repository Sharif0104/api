const { createLogger, format, transports } = require('winston');
require('winston-daily-rotate-file');

const dailyRotateFileTransport = new transports.DailyRotateFile({
  filename: 'logs/%DATE%-results.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d'
});

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    dailyRotateFileTransport,
    new transports.Console({
      format: format.simple()
    })
  ]
});

module.exports = logger;
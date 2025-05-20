const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf, json } = format;
const path = require('path');

const auditLogger = createLogger({
  level: 'info',
  format: combine(
    timestamp(),
    json()
  ),
  transports: [
    new transports.File({ filename: path.join(__dirname, '../../logs/audit.log'), maxsize: 10485760, maxFiles: 10 })
  ]
});

module.exports = auditLogger;

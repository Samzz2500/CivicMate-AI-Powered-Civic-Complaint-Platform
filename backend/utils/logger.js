// Simple logging utility

const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const getTimestamp = () => new Date().toISOString();

const writeLog = (level, message, meta = {}) => {
  const logEntry = {
    timestamp: getTimestamp(),
    level,
    message,
    ...meta,
  };

  const logFile = path.join(logDir, `${level}.log`);
  fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');

  // Also log to console in development
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[${level.toUpperCase()}]`, message, meta);
  }
};

const logger = {
  info: (message, meta) => writeLog('info', message, meta),
  error: (message, meta) => writeLog('error', message, meta),
  warn: (message, meta) => writeLog('warn', message, meta),
  debug: (message, meta) => writeLog('debug', message, meta),
};

module.exports = logger;

const { createLogger, format, transports } = require('winston');
const path = require('path');

const { combine, timestamp, errors, json, colorize, printf } = format;

const devFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), errors({ stack: true })),
  transports: [
    process.env.NODE_ENV === 'production'
      ? new transports.File({ filename: path.join('logs', 'app.log'), format: json() })
      : new transports.Console({ format: combine(colorize(), devFormat) }),
  ],
  exceptionHandlers: [new transports.Console()],
});

module.exports = logger;

import winston from 'winston';
import config from '../../config';

const logger = winston.createLogger({
    level: config.application.logLevel,
    format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => {
            return `[${timestamp}] ${level}: ${message}`;
        })
    ),
    transports: [
        new winston.transports.Console(),
    ],
});

export default logger;

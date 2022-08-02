import winston from 'winston';

winston.add(new winston.transports.Console());
winston.format.combine(
  winston.format.json(),
  winston.format.colorize(),
);

export const logger = winston;

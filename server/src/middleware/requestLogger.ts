// server/src/middleware/requestLogger.ts

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  
  // Log request
  logger.debug(`Incoming ${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  // Capture response
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.http(req.method, req.path, res.statusCode, duration);
  });

  next();
};

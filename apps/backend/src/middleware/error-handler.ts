import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { statusCode = 500, message } = err;

  logger.error({
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    statusCode,
    body: req.body,
    params: req.params,
    query: req.query,
  });

  if (process.env.NODE_ENV === 'production' && !err.isOperational) {
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong!'
    });
  } else {
    res.status(statusCode).json({
      status: 'error',
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  }
};
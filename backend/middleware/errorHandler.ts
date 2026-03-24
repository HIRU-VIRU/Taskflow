import { Request, Response, NextFunction } from 'express';

/**
 * Error Handler Middleware
 * Catches all errors and returns consistent error response
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);

  // Handle known error types
  if (err.message.includes('already exists')) {
    res.status(409).json({
      success: false,
      error: {
        code: 'CONFLICT',
        message: err.message,
      },
    });
    return;
  }

  if (err.message.includes('not found')) {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: err.message,
      },
    });
    return;
  }

  if (err.message.includes('Invalid credentials')) {
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      },
    });
    return;
  }

  if (err.message.includes('Cannot downgrade')) {
    res.status(400).json({
      success: false,
      error: {
        code: 'DOWNGRADE_NOT_ALLOWED',
        message: err.message,
      },
    });
    return;
  }

  // Default error response
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    },
  });
};

const errorHandler = (error, req, res, next) => {
  console.error('Error details:', {
    message: error.message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  // Prisma errors
  if (error.code && error.code.startsWith('P')) {
    switch (error.code) {
      case 'P2002':
        return res.status(409).json({
          error: 'Conflict',
          message: 'A record with this data already exists',
          field: error.meta?.target,
        });
      case 'P2025':
        return res.status(404).json({
          error: 'Not found',
          message: 'The requested record was not found',
        });
      case 'P2003':
        return res.status(400).json({
          error: 'Bad request',
          message: 'Foreign key constraint failed',
        });
      default:
        return res.status(500).json({
          error: 'Database error',
          message: 'A database error occurred',
        });
    }
  }

  // Validation errors
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation error',
      message: error.message,
      details: error.details || undefined,
    });
  }

  // JWT errors (handled in auth middleware, but just in case)
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Authentication error',
      message: 'Invalid token',
    });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Authentication error',
      message: 'Token expired',
    });
  }

  // Default error response
  const statusCode = error.statusCode || error.status || 500;
  const message = error.message || 'Internal server error';

  res.status(statusCode).json({
    error: statusCode >= 500 ? 'Internal server error' : 'Bad request',
    message: process.env.NODE_ENV === 'production' && statusCode >= 500 
      ? 'Something went wrong on our end' 
      : message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
};

module.exports = errorHandler;
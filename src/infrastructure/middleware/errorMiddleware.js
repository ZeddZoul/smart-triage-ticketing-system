const { ZodError } = require('zod');
const {
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ConflictError,
  InvalidStatusTransitionError,
  InvalidIdError,
  TokenExpiredError,
  ExternalServiceError,
} = require('../../entities/errors');

function errorMiddleware(err, req, res, _next) {
  if (res.headersSent) {
    return;
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Input validation failed',
        details: err.issues,
      },
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
    });
  }

  let status = 500;
  if (err instanceof ValidationError || err instanceof InvalidIdError) status = 400;
  else if (err instanceof UnauthorizedError || err instanceof TokenExpiredError) status = 401;
  else if (err instanceof NotFoundError) status = 404;
  else if (err instanceof ConflictError) status = 409;
  else if (err instanceof InvalidStatusTransitionError) status = 422;
  else if (err instanceof ExternalServiceError) status = 503;

  return res.status(status).json({
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: err.message || 'Unexpected server error',
      details: err.details || null,
    },
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
  });
}

module.exports = errorMiddleware;

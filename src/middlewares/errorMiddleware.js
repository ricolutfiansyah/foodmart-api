import { sendError } from '../utils/response.js';

export const errorMiddleware = (err, req, res, next) => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let errors = null;

  if (err.isOperational) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err.name === 'ZodError') {
    statusCode = 400;
    message = 'Validation Error';
    errors = err.errors.map(e => ({
      field: e.path.join('.'),
      message: e.message
    }));
  } else if (err.code === 'P2002') {
    statusCode = 409;
    message = `Duplicate field value: ${err.meta?.target}`;
  } else if (err.code === 'P2025') {
    statusCode = 404;
    message = 'Record not found';
  } else {
    // Log unexpected errors
    console.error('[Error]', err);
  }

  sendError(res, statusCode, message, errors);
};

import { AppError } from '../utils/AppError.js';

export const roleMiddleware = (req, res, next) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return next(new AppError('Forbidden: Insufficient privileges', 403));
  }
  next();
};

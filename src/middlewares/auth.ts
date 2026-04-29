import { AppError } from '@/utils/AppError.js';
import type { Response, Request, NextFunction } from 'express';

export const auth = (req: Request, res: Response, next: NextFunction) => { // How to use?
  const token = req.headers.authorization;

  if (!token) {
    return next(new AppError('Unauthorized', 401, 'UNAUTHORIZED'));
  }

  // verify token here


  next();
};
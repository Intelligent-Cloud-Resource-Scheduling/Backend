import { AppError } from '@/utils/AppError.js';
import type { Response, Request, NextFunction } from 'express';

// Global Validator
// Passing Zod schema to the validate data and show error if something not valid 
export const validate = (schema: any) => (req: Request, res: Response, next: NextFunction) => { // How to use?
  const result = schema.safeParse(req.body);

  if (!result.success) {
    const details = result.error.issues.map((e: any) => ({
      field: e.path.join('.'),
      message: e.message,
    }));

    return next(new AppError('Validation failed', 400, 'VALIDATION_ERROR', details));
  }

  req.body = result.data;
  next();
};
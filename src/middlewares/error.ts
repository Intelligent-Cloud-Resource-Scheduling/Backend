import type { ApiResponse } from '@/types/unifiedResponse.js';
import { sendError } from '@/utils/response.js';
import type { Response, Request, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { AppError } from '@/utils/AppError.js';

export const errorHandler = <T>(err: any, req: Request, res: Response, next: NextFunction): Response<ApiResponse<T>> => { // How to use?
  let error = err; // to preserve the original err var.

  // Intercept Prisma Errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      // P2002 is the Unique Constraint code
      const field = (err.meta?.target as string[])?.join(', ') || 'field';
      error = new AppError(
        `A user with this ${field} already exists.`, 
        409, // Conflict
        'DUPLICATE_ENTRY',
        [{ field, message: `The ${field} is already taken.` }]
      );
    }
  }

  // hide internal details to not exploid any internal states about the server for the user if internal server error.
  if (process.env.NODE_ENV === 'production' && error.status === 500) {
    console.log(error)
    error.message = 'Something went wrong';
  }

  return sendError(res, error);
};
import type { ApiResponse } from '../types/unifiedResponse.js';
import { sendError } from '../utils/response.js';
import type { Response, Request, NextFunction } from 'express';

export const errorHandler = <T>(err:any, req: Request, res: Response, next: NextFunction) : Response<ApiResponse<T>> => { // How to use?
  // hide internal details
  if (process.env.NODE_ENV === 'production' && err.status === 500) {
    console.log(err)
    err.message = 'Something went wrong';
  }

  return sendError(res, err);
};
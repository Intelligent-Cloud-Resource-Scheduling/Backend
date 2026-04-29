import { sendError } from '../utils/response.js';
import type { Response, Request } from 'express';

export const errorHandler = (err:any, req: Request, res: Response, next: any) => {
  // hide internal details
  if (process.env.NODE_ENV === 'production' && err.status === 500) {
    console.log(err)
    err.message = 'Something went wrong';
  }

  return sendError(res, err);
};
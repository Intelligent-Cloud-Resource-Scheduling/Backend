import type { Response } from 'express';
import type { ApiResponse } from '../types/unifiedResponse.js';

export const sendSuccess = <T>(res: Response, data: any, message = 'Success', status = 200) : Response<ApiResponse<T>> => {
  return res.status(status).json({
    success: true,
    message,
    data,
    requestId: res.locals.requestId,
  });
};

export const sendError = <T>(res: Response, err: any) : Response<ApiResponse<T>> => {
  return res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: {
      code: err.code || 'INTERNAL_ERROR',
    },
    requestId: res.locals.requestId,
  });
};
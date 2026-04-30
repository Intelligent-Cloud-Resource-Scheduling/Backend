import type { Response, Request, NextFunction, RequestHandler  } from 'express';

// Instead of repeating try and catch
export const asyncHandler = (fn: RequestHandler): RequestHandler => { // How to use?
  return (req:Request, res:Response, next:NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};


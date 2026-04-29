import { randomUUID } from 'crypto';
import type { Response, Request, NextFunction } from 'express';

export const requestId = (req:Request, res:Response, next:NextFunction) => {  // How to use?
  const id = randomUUID();
  res.locals.requestId = id;
  next();
};
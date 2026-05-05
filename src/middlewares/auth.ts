import { AppError } from '@/utils/AppError.js';
import jwt from 'jsonwebtoken';
import type { Response, Request, NextFunction } from 'express';
import { verifyToken } from '@/utils/jwt.js';
import { prisma } from '../config/prisma.js';
import { ERRORS } from '@/constants/errorCodes.js';

export const authUser = async (req: Request, res: Response, next: NextFunction) => { // How to use?
  let token = req.headers.authorization;

  if (!token) {
    return next(new AppError('Unauthorized', 401, ERRORS.E401U));
  }

  const decoded = verifyToken(token as string);

  if (decoded.role != "USER") {
    return next(new AppError('Unauthorized', 401, ERRORS.E401U));
  }

  const user = await prisma.users.findUnique({
    where: {uuid: decoded.uuid}
  })

  if(!user) {
    throw new AppError("Invalid credentials", 401, ERRORS.E401);
  }


  next();
};
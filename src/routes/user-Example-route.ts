// modules/user.ts
import { Router } from 'express';
import { prisma } from '../config/prisma.js';
import { sendSuccess } from '../utils/response.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { validate } from '../middlewares/validate.js';
import { z } from 'zod';
import { AppError } from '../utils/AppError.js';

const router = Router();

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
});

// CREATE USER
router.post(
  '/',
  validate(createUserSchema),
  asyncHandler(async (req, res) => {
    const user = await prisma.user.create({
      data: req.body,
    });

    return sendSuccess(res, user, 'User created');
  })
);

// GET USER
router.get(
  '/:id',
  asyncHandler(async (req, res, next) => {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    return sendSuccess(res, user);
  })
);

export default router;

// modules/user.ts
import { Router } from 'express';
import { prisma } from '../config/prisma.js';
import { sendSuccess } from '../utils/response.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { validate } from '../middlewares/validate.js';
import { z } from 'zod';
import { AppError } from '../utils/AppError.js';
import { registerUser } from '@/controllers/userController.js';

const router = Router();

const createUserSchema = z.object({
  email: z.email(),
  name: z.string().min(2),
  password: z.string().min(6)
});

router.post('/register', validate(createUserSchema), asyncHandler(registerUser));

// GET USER
router.get(
  '/:id',
  asyncHandler(async (req, res, next) => {
    const user = await prisma.users.findUnique({
      where: { id: Number(req.params.id) },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    return sendSuccess(res, user);
  })
);

export default router;

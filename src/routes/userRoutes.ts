// modules/user.ts
import { Router } from 'express';
import { prisma } from '../config/prisma.js';
import { sendSuccess } from '../utils/response.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { validate } from '../middlewares/validate.js';
import { z } from 'zod';
import { AppError } from '../utils/AppError.js';
import { getAllUsers, getUser, loginUser, registerUser } from '@/controllers/userController.js';

const router = Router();

const registerUserSchema = z.object({
  email: z.email(),
  name: z.string().min(2),
  password: z.string().min(6)
});

const loginUserSchema = z.object({
  email: z.email(),
  password: z.string()
})

router.post('/register', validate(registerUserSchema), asyncHandler(registerUser));
router.post('/login', validate(loginUserSchema), asyncHandler(loginUser));
router.get('/all', asyncHandler(getAllUsers))
router.get('/:uuid', asyncHandler(getUser))

export default router;

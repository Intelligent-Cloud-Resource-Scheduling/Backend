// modules/admin.ts
import { Router } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { validate } from '../middlewares/validate.js';
import { z } from 'zod';
import { loginAdmin } from '@/controllers/adminController.js';

const router = Router();

const loginAdminSchema = z.object({
  email: z.email(),
  password: z.string()
})

router.post('/login', validate(loginAdminSchema), asyncHandler(loginAdmin));

export default router;
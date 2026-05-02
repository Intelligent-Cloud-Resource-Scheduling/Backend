import { type Request, type Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma.js';
import { sendSuccess } from '../utils/response.js';
import { AppError } from '@/utils/AppError.js';
import { generateAdminToken } from '@/utils/jwt.js';

export const loginAdmin = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const admin = await prisma.admins.findUnique({
    where: { email }
  })

  if(!admin) {
    throw new AppError("Invalid credentials", 400, "INVALID_CREDENTIALS");
  }
  
  const passwordsMatch = await bcrypt.compare(password, admin.password);
  if(!passwordsMatch) {
    throw new AppError("Invalid credentials", 400, "INVALID_CREDENTIALS");
  }

  const token = generateAdminToken(admin)

  const { password: _, ...adminWithoutPass } = admin;

  const loginRes = {
    admin: adminWithoutPass,
    token,
  }

  return sendSuccess(res, loginRes, 'Logged in successfully.');
}
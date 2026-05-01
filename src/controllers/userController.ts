import { type Request, type Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma.js';
import { sendSuccess } from '../utils/response.js';
import { AppError } from '@/utils/AppError.js';
import { generateUserToken } from '@/utils/jwt.js';

export const registerUser = async (req: Request, res: Response) => {
  const { email, name, password } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.users.create({
    data: {
      email,
      name,
      password: hashedPassword
    }
  });

  const token = generateUserToken(user)

  const { password: _, ...userWithoutPass } = user;

  const registerRes = {
    user: userWithoutPass,
    token,
  }

  return sendSuccess(res, registerRes, 'User created');
};

export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await prisma.users.findUnique({
    where: { email }
  })

  if(!user) {
    throw new AppError("Invalid credentials", 400, "INVALID_CREDENTIALS");
  }
  
  const passwordsMatch = await bcrypt.compare(password, user.password);
  if(!passwordsMatch) {
    throw new AppError("Invalid credentials", 400, "INVALID_CREDENTIALS");
  }

  const token = generateUserToken(user)

  const { password: _, ...userWithoutPass } = user;

  const loginRes = {
    user: userWithoutPass,
    token,
  }

  return sendSuccess(res, loginRes, 'Logged in successfully.');
}
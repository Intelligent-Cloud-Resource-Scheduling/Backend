import { type Request, type Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma.js';
import { sendSuccess } from '../utils/response.js';
import { AppError } from '@/utils/AppError.js';
import { generateUserToken } from '@/utils/jwt.js';
import { ERRORS } from '@/constants/errorCodes.js';

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
    throw new AppError("Invalid credentials", 401, ERRORS.E401);
  }
  
  const passwordsMatch = await bcrypt.compare(password, user.password);
  if(!passwordsMatch) {
    throw new AppError("Invalid credentials", 401, ERRORS.E401);
  }

  const token = generateUserToken(user)

  const { password: _, ...userWithoutPass } = user;

  const loginRes = {
    user: userWithoutPass,
    token,
  }

  return sendSuccess(res, loginRes, 'Logged in successfully.');
}

export const getUser = async (req: Request, res: Response) => {
  const { uuid } = req.params;

  // Type Narrowing
  if (typeof uuid !== 'string') {
    throw new AppError("Invalid UUID format", 400, 'BAD_REQUEST');
  }

  const user = await prisma.users.findFirst({
    where: {
      uuid
    }
  })

  if(!user)  {
    throw new AppError("User not found", 404, "NOT_FOUND");
  }

  const { password: _, ...userWithouPassword } = user;

  return sendSuccess(res, userWithouPassword, 'User data retrieved successfully.')
}

export const getAllUsers = async (req: Request, res: Response) => {
  const users = await prisma.users.findMany({
    select: {
      id: true,
      uuid: true,
      email: true,
      name: true,
      plan_uuid: true,
      created_at: true
    }
  });

  if(!users) {
    throw new AppError("There are no users.", 404, "NOT_FOUND");
  }

  sendSuccess(res, users, "All users retrieved successfully.")
  
}
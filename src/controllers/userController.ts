import { type Request, type Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma.js';
import { sendSuccess } from '../utils/response.js';
import jwt from "jsonwebtoken"

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

  const jwtPayload = {
    id: user.id,
    uuid: user.uuid,
    email: user.email,
    role: "USER"
  }

  const token = jwt.sign(
    jwtPayload,
    process.env.JWT_SECRET as string,
    { expiresIn: '14d' }
  )

  const { password: _, ...userWithoutPass } = user;

  const registerRes = {
    user: userWithoutPass,
    token,
  }

  return sendSuccess(res, registerRes, 'User created');
};
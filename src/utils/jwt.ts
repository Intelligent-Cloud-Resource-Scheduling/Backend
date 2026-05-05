import jwt from 'jsonwebtoken';

// Define the shape of the needed user attributes for creating the token
interface JwtPayload {
  id: number;
  uuid: string;
  email: string;
}

interface JwtOutput {
  id: number;
  uuid: string;
  email: string;
  role: "USER" | "ADMIN",
  iat: number;
  exp: number;
}

export const generateUserToken = (user: JwtPayload): string => {
  const jwtPayload = {
    id: user.id,
    uuid: user.uuid,
    email: user.email,
    role: "USER",
  }

  return jwt.sign(
    jwtPayload,
    process.env.JWT_SECRET as string,
    { expiresIn: '14d' }
  );
};

export const generateAdminToken = (admin: JwtPayload): string => {
  const jwtPayload = {
    id: admin.id,
    uuid: admin.uuid,
    email: admin.email,
    role: "ADMIN",
  }

  return jwt.sign(
    jwtPayload,
    process.env.JWT_SECRET as string,
    { expiresIn: '14d' }
  );
};

export const verifyToken = (token: string): JwtOutput => {
  const result:JwtOutput = jwt.verify(token, process.env.JWT_SECRET as string) as JwtOutput;
  return result;
};
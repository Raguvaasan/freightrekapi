import jwt, { SignOptions } from "jsonwebtoken";

const { JWT_SECRET, JWT_EXPIRES_IN } = process.env;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in environment variables");
}

export const generateToken = (userId: string): string => {
  const options: SignOptions = {
    expiresIn: (JWT_EXPIRES_IN || '7d') as SignOptions['expiresIn'],
  };

  return jwt.sign({ id: userId }, JWT_SECRET, options);
};

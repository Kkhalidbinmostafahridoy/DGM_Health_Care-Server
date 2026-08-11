import { JwtPayload, Secret, SignOptions } from "jsonwebtoken";
import jwt from "jsonwebtoken";

const generateToken = (payload: any, secret: Secret, expiresIn: string) => {
  // added new for undefine user email and userId
  const jwtPayload = {
    userId: payload.id || payload.userId, // fallback in case the property is named userId
    role: payload.role,
    email: payload.email, // Email is now included in the token
  };
  const Token = jwt.sign(jwtPayload, secret, {
    algorithm: "HS256",
    expiresIn,
  } as SignOptions);
  return Token;
};

const verifyToken = (token: string, secret: Secret) => {
  return jwt.verify(token, secret) as JwtPayload;
};

export const jwtHelper = {
  generateToken,
  verifyToken,
};

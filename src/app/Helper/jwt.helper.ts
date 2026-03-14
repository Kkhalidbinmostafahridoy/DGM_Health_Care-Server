import { Secret, SignOptions } from "jsonwebtoken";
import jwt from "jsonwebtoken";

const generateToken = (payload: any, secret: Secret, expiresIn: string) => {
  const Token = jwt.sign(payload, secret, {
    algorithm: "HS256",
    expiresIn,
  } as SignOptions);
  return Token;
};

export const jwtHelper = {
  generateToken,
};

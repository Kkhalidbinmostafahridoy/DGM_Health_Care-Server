import { NextFunction, Request, Response } from "express";
import { jwtHelper } from "../Helper/jwt.helper";

export const auth = (...roles: string[]) => {
  return async (
    req: Request & { user?: any },
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const token = req.cookies.accessToken;
      if (!token) {
        throw new Error("You are not authorize");
      }
      const verifyUser = jwtHelper.verifyToken(token, "abc");
      req.user = verifyUser;
      if (roles.length && !roles.includes(verifyUser.role)) {
        throw new Error("You are not authorize to access this route");
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};

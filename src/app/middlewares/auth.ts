import { NextFunction, Request, Response } from "express";
import { jwtHelper } from "../Helper/jwt.helper";
import ApiErrorHandler from "../error/apiErrorHandler";
import httpStatus from "http-status";

export const auth = (...roles: string[]) => {
  return async (
    req: Request & { user?: any },
    res: Response,
    next: NextFunction,
  ) => {
    try {
      let token = req.cookies?.accessToken || req.headers.authorization;
      if (token && token.startsWith("Bearer ")) {
        token = token.split(" ")[1];
      }

      if (!token) {
        throw new ApiErrorHandler(
          httpStatus.UNAUTHORIZED,
          "You are not authorized",
        );
      }
      const verifyUser = jwtHelper.verifyToken(
        token,
        process.env.JWT_SECRET as string,
      );
      req.user = verifyUser;
      if (roles.length && !roles.includes(verifyUser.role)) {
        throw new ApiErrorHandler(
          httpStatus.FORBIDDEN,
          "You are not authorized to access this route",
        );
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};

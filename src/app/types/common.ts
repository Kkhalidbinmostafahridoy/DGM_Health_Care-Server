import { UserRole } from "@prisma/client";

export type IJWTPayload = {
  userId: string;
  email: string;
  role: UserRole;
};

// import { Prisma } from "@prisma/client";
// import { prisma } from "../../../shared/prisma";
// import bcrypt from "bcryptjs";
// import { UserStatus } from "@prisma/client";
// import { jwtHelper } from "../../../Helper/jwt.helper";
// import ApiErrorHandler from "../../../error/apiErrorHandler";
// import httpStatus from "http-status";
// import { Secret } from "jsonwebtoken";
// import config from "../../../../config";
// import { emailSender } from "./emailSender";

// const login = async (payload: { email: string; password: string }) => {
//   const user = await prisma.user.findUnique({
//     where: {
//       email: payload.email,
//     },
//   });

//   if (!user) {
//     throw new ApiErrorHandler(httpStatus.NOT_FOUND, "User not found");
//   }

//   if (user.UserStatus !== UserStatus.ACTIVE) {
//     throw new ApiErrorHandler(
//       httpStatus.BAD_REQUEST,
//       `User is ${user.UserStatus.toLowerCase()}`,
//     );
//   }

//   const isCorrectPassword = await bcrypt.compare(
//     payload.password,
//     user.password,
//   );
//   if (!isCorrectPassword) {
//     throw new ApiErrorHandler(httpStatus.BAD_REQUEST, "Password is incorrect");
//   }

//   const accessToken = jwtHelper.generateToken(
//     { email: user.email, role: user.UserRole, userId: user.id },
//     process.env.JWT_SECRET as string,
//     "15m",
//   );

//   const refreshToken = jwtHelper.generateToken(
//     { email: user.email, role: user.UserRole, userId: user.id },
//     process.env.JWT_SECRET as string,
//     "7d",
//   );

//   return {
//     accessToken,
//     refreshToken,
//     needPasswordChange: user.needPasswordChange,
//   };
// };

// const refreshToken = async (refreshToken: string) => {
//   const decoded = jwtHelper.verifyToken(
//     refreshToken,
//     process.env.JWT_SECRET as string,
//   );

//   if (!decoded) {
//     throw new ApiErrorHandler(httpStatus.UNAUTHORIZED, "Invalid refresh token");
//   }

//   const user = await prisma.user.findUnique({
//     where: {
//       email: decoded.email,
//     },
//   });

//   if (!user) {
//     throw new ApiErrorHandler(httpStatus.NOT_FOUND, "User not found");
//   }

//   const newAccessToken = jwtHelper.generateToken(
//     { email: user.email, role: user.UserRole, userId: user.id },
//     process.env.JWT_SECRET as string,
//     "15m",
//   );

//   const newRefreshToken = jwtHelper.generateToken(
//     { email: user.email, role: user.UserRole, userId: user.id },
//     process.env.JWT_SECRET as string,
//     "7d",
//   );

//   return {
//     accessToken: newAccessToken,
//     newRefreshToken: newRefreshToken,
//   };
// };

// const changePassword = async (
//   userId: string,
//   oldPassword: string,
//   newPassword: string,
// ) => {
//   const user = await prisma.user.findUnique({
//     where: {
//       id: userId,
//     },
//   });

//   if (!user) {
//     throw new ApiErrorHandler(httpStatus.NOT_FOUND, "User not found");
//   }

//   const isCorrectPassword = await bcrypt.compare(oldPassword, user.password);
//   if (!isCorrectPassword) {
//     throw new ApiErrorHandler(
//       httpStatus.BAD_REQUEST,
//       "Old password is incorrect",
//     );
//   }

//   const hashedNewPassword = await bcrypt.hash(newPassword, 10);

//   await prisma.user.update({
//     where: {
//       id: userId,
//     },
//     data: {
//       password: hashedNewPassword,
//       needPasswordChange: false,
//     },
//   });

//   return { message: "Password changed successfully" };
// };

// const forgotPassword = async (payload: { email: string }) => {
//   const user = await prisma.user.findUnique({
//     where: {
//       email: payload.email,
//       status: UserStatus.ACTIVE,
//     },
//   });

//   if (!user) {
//     throw new ApiErrorHandler(httpStatus.NOT_FOUND, "User not found");
//   }

//   const resetPasswordToken = jwtHelper.generateToken(
//     { email: user.email, role: user.UserRole, userId: user.id },
//     config.jwt.reset_pass_secret as Secret,
//     config.jwt.reset_pass_token_expires_in as string,
//   );

//   const resetPasswordLink =
//     config.reset_pass_link + `?userId=${user.id}&token=${resetPasswordToken}`;

//   console.log("Reset Password Link:", resetPasswordLink);
//   const emailSent = await emailSender(
//     user.email,
//     "Reset Password - DGM Care",
//     `<div>
//       <p>Click the link below to reset your password:</p>
//       <a href="${resetPasswordLink}"><button>Reset Password</button></a>
//     </div>`,
//   );

//   return { message: "Password reset link sent to email" };
// };

// const resetPassword = async (payload: {
//   id: string;
//   token: string;
//   newPassword: string;
// }) => {
//   // Here you would verify the token and find the user associated with it.
//   // For simplicity, we'll assume the token is valid and corresponds to a user.

//   const user = await prisma.user.findUniqueOrThrow({
//     where: {
//       id: payload.id,
//       status: UserStatus.ACTIVE,
//     },
//   });

//   const isValidToken = jwtHelper.verifyToken(
//     payload.token,
//     config.jwt.reset_pass_secret as Secret,
//   );

//   if (!isValidToken) {
//     throw new ApiErrorHandler(
//       httpStatus.UNAUTHORIZED,
//       "Invalid or expired token",
//     );
//   }

//   const userId = "someUserId"; // This should be extracted from the token

//   const hashedNewPassword = await bcrypt.hash(
//     payload.newPassword,
//     Number(process.env.BCRYPT_SALT_ROUNDS) || 10,
//   );

//   await prisma.user.update({
//     where: {
//       id: payload.id,
//     },
//     data: {
//       password: hashedNewPassword,
//       needPasswordChange: false,
//     },
//   });

//   return { message: "Password has been reset successfully" };
// };
// export const authService = {
//   login,
//   refreshToken,
//   changePassword,
//   forgotPassword,
//   resetPassword,
// };

import bcrypt from "bcryptjs";
import { UserStatus } from "@prisma/client";
import { Secret } from "jsonwebtoken";

import { prisma } from "../../../shared/prisma";
import { jwtHelper } from "../../../Helper/jwt.helper";
import ApiErrorHandler from "../../../error/apiErrorHandler";
import httpStatus from "http-status";
import config from "../../../../config";
import { emailSender } from "./emailSender";

// ======================================================
// LOGIN
// ======================================================

const login = async (payload: { email: string; password: string }) => {
  const email = payload.email.toLowerCase().trim();

  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    throw new ApiErrorHandler(httpStatus.NOT_FOUND, "User not found");
  }

  if (user.UserStatus !== UserStatus.ACTIVE) {
    throw new ApiErrorHandler(
      httpStatus.BAD_REQUEST,
      `User is ${user.UserStatus.toLowerCase()}`,
    );
  }

  const isCorrectPassword = await bcrypt.compare(
    payload.password,
    user.password,
  );

  if (!isCorrectPassword) {
    throw new ApiErrorHandler(httpStatus.BAD_REQUEST, "Password is incorrect");
  }

  const jwtPayload = {
    email: user.email,
    role: user.UserRole,
    userId: user.id,
  };

  const accessToken = jwtHelper.generateToken(
    jwtPayload,
    process.env.JWT_SECRET as string,
    "15m",
  );

  const refreshToken = jwtHelper.generateToken(
    jwtPayload,
    process.env.JWT_SECRET as string,
    "7d",
  );

  return {
    accessToken,
    refreshToken,
    needPasswordChange: user.needPasswordChange,
  };
};

// ======================================================
// REFRESH TOKEN
// ======================================================

const refreshToken = async (refreshToken: string) => {
  if (!refreshToken) {
    throw new ApiErrorHandler(
      httpStatus.UNAUTHORIZED,
      "Refresh token is required",
    );
  }

  const decoded = jwtHelper.verifyToken(
    refreshToken,
    process.env.JWT_SECRET as string,
  );

  if (!decoded) {
    throw new ApiErrorHandler(
      httpStatus.UNAUTHORIZED,
      "Invalid or expired refresh token",
    );
  }

  const user = await prisma.user.findUnique({
    where: {
      id: decoded.userId,
    },
  });

  if (!user) {
    throw new ApiErrorHandler(httpStatus.NOT_FOUND, "User not found");
  }

  if (user.UserStatus !== UserStatus.ACTIVE) {
    throw new ApiErrorHandler(
      httpStatus.UNAUTHORIZED,
      `User is ${user.UserStatus.toLowerCase()}`,
    );
  }

  const jwtPayload = {
    email: user.email,
    role: user.UserRole,
    userId: user.id,
  };

  const newAccessToken = jwtHelper.generateToken(
    jwtPayload,
    process.env.JWT_SECRET as string,
    "15m",
  );

  const newRefreshToken = jwtHelper.generateToken(
    jwtPayload,
    process.env.JWT_SECRET as string,
    "7d",
  );

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

// ======================================================
// CHANGE PASSWORD
// ======================================================

const changePassword = async (
  userId: string,
  oldPassword: string,
  newPassword: string,
) => {
  if (!oldPassword || !newPassword) {
    throw new ApiErrorHandler(
      httpStatus.BAD_REQUEST,
      "Old password and new password are required",
    );
  }

  if (newPassword.length < 6) {
    throw new ApiErrorHandler(
      httpStatus.BAD_REQUEST,
      "New password must be at least 6 characters",
    );
  }

  if (oldPassword === newPassword) {
    throw new ApiErrorHandler(
      httpStatus.BAD_REQUEST,
      "New password must be different from old password",
    );
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new ApiErrorHandler(httpStatus.NOT_FOUND, "User not found");
  }

  if (user.UserStatus !== UserStatus.ACTIVE) {
    throw new ApiErrorHandler(
      httpStatus.BAD_REQUEST,
      `User is ${user.UserStatus.toLowerCase()}`,
    );
  }

  const isCorrectPassword = await bcrypt.compare(oldPassword, user.password);

  if (!isCorrectPassword) {
    throw new ApiErrorHandler(
      httpStatus.BAD_REQUEST,
      "Old password is incorrect",
    );
  }

  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;

  const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      password: hashedNewPassword,
      needPasswordChange: false,
    },
  });

  return {
    message: "Password changed successfully",
  };
};

// ======================================================
// FORGOT PASSWORD
// ======================================================

const forgotPassword = async (payload: { email: string }) => {
  const email = payload.email.toLowerCase().trim();

  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    throw new ApiErrorHandler(httpStatus.NOT_FOUND, "User not found");
  }

  // IMPORTANT:
  // Your Prisma field is UserStatus, NOT status.
  if (user.UserStatus !== UserStatus.ACTIVE) {
    throw new ApiErrorHandler(
      httpStatus.BAD_REQUEST,
      `User is ${user.UserStatus.toLowerCase()}`,
    );
  }

  const resetPasswordToken = jwtHelper.generateToken(
    {
      email: user.email,
      role: user.UserRole,
      userId: user.id,
    },
    config.jwt.reset_pass_secret as Secret,
    config.jwt.reset_pass_token_expires_in as string,
  );

  const resetPasswordLink =
    `${config.reset_pass_link}` +
    `?userId=${encodeURIComponent(user.id)}` +
    `&token=${encodeURIComponent(resetPasswordToken)}`;

  console.log("Reset Password Link:", resetPasswordLink);

  await emailSender(
    user.email,
    "Reset Password - DGM Care",
    `
      <div style="font-family: Arial, sans-serif;">
        <h2>DGM Care - Password Reset</h2>

        <p>Hello,</p>

        <p>
          We received a request to reset your DGM Care account password.
        </p>

        <p>
          Click the button below to reset your password:
        </p>

        <p>
          <a
            href="${resetPasswordLink}"
            style="
              display:inline-block;
              padding:12px 20px;
              background:#2563eb;
              color:#ffffff;
              text-decoration:none;
              border-radius:6px;
            "
          >
            Reset Password
          </a>
        </p>

        <p>
          If you did not request this password reset,
          you can safely ignore this email.
        </p>

        <p>
          Regards,<br/>
          DGM Care Team
        </p>
      </div>
    `,
  );

  return {
    message: "Password reset link sent to email",
  };
};

// ======================================================
// RESET PASSWORD
// ======================================================

const resetPassword = async (
  payload: {
    id: string;
    token: string;
    newPassword: string;
  },
  newPassword?: any,
) => {
  if (!payload.id) {
    throw new ApiErrorHandler(httpStatus.BAD_REQUEST, "User ID is required");
  }

  if (!payload.token) {
    throw new ApiErrorHandler(
      httpStatus.BAD_REQUEST,
      "Reset token is required",
    );
  }

  if (!payload.newPassword) {
    throw new ApiErrorHandler(
      httpStatus.BAD_REQUEST,
      "New password is required",
    );
  }

  if (payload.newPassword.length < 6) {
    throw new ApiErrorHandler(
      httpStatus.BAD_REQUEST,
      "New password must be at least 6 characters",
    );
  }

  // ====================================================
  // Verify Reset Token
  // ====================================================

  const decoded = jwtHelper.verifyToken(
    payload.token,
    config.jwt.reset_pass_secret as Secret,
  );

  if (!decoded) {
    throw new ApiErrorHandler(
      httpStatus.UNAUTHORIZED,
      "Invalid or expired reset token",
    );
  }

  // ====================================================
  // Check Token User ID
  // ====================================================

  if (decoded.userId !== payload.id) {
    throw new ApiErrorHandler(
      httpStatus.UNAUTHORIZED,
      "Invalid password reset request",
    );
  }

  // ====================================================
  // Find User
  // ====================================================

  const user = await prisma.user.findUnique({
    where: {
      id: payload.id,
    },
  });

  if (!user) {
    throw new ApiErrorHandler(httpStatus.NOT_FOUND, "User not found");
  }

  if (user.UserStatus !== UserStatus.ACTIVE) {
    throw new ApiErrorHandler(
      httpStatus.BAD_REQUEST,
      `User is ${user.UserStatus.toLowerCase()}`,
    );
  }

  // ====================================================
  // Optional: Verify Token Email
  // ====================================================

  if (decoded.email !== user.email) {
    throw new ApiErrorHandler(
      httpStatus.UNAUTHORIZED,
      "Invalid password reset token",
    );
  }

  // ====================================================
  // Hash New Password
  // ====================================================

  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;

  const hashedNewPassword = await bcrypt.hash(payload.newPassword, saltRounds);

  // ====================================================
  // Update Password
  // ====================================================

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      password: hashedNewPassword,
      needPasswordChange: false,
    },
  });

  return {
    message: "Password has been reset successfully",
  };
};

// ======================================================
// EXPORT
// ======================================================
// const getMe = async (session: any) => {
//   const accessToken = session?.accessToken;
//   const decodedData = jwtHelper.verifyToken(
//     accessToken,
//     config.jwt.jwt_secret as Secret,
//   );

//   const userData = await prisma.user.findUniqueOrThrow({
//     where: {
//       email: decodedData.email,
//       status: UserStatus.ACTIVE,
//     },
//   });

//   const { id, email, role, needPasswordChange, status } = userData;
//   return {
//     id,
//     email,
//     role,
//     needPasswordChange,
//     status,
//   };
// };

const getMe = async (session: any) => {
  const accessToken = session?.accessToken;

  if (!accessToken) {
    throw new ApiErrorHandler(
      httpStatus.UNAUTHORIZED,
      "Access token is required",
    );
  }

  const decodedData = jwtHelper.verifyToken(
    accessToken,
    config.jwt.jwt_secret as Secret,
  );

  if (!decodedData) {
    throw new ApiErrorHandler(
      httpStatus.UNAUTHORIZED,
      "Invalid or expired access token",
    );
  }

  const userData = await prisma.user.findUniqueOrThrow({
    where: {
      id: decodedData.userId,
    },
  });

  if (userData.UserStatus !== UserStatus.ACTIVE) {
    throw new ApiErrorHandler(
      httpStatus.BAD_REQUEST,
      `User is ${String(userData.UserStatus).toLowerCase()}`,
    );
  }

  return {
    id: userData.id,
    email: userData.email,
    role: userData.UserRole,
    needPasswordChange: userData.needPasswordChange,
    status: userData.UserStatus,
  };
};
export const authService = {
  login,
  refreshToken,
  changePassword,
  forgotPassword,
  resetPassword,
  getMe,
};

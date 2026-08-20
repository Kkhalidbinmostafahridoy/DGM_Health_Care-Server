import { prisma } from "../shared/prisma";
import bcrypt from "bcryptjs";
import { UserRole, UserStatus } from "@prisma/client";

export const seedAdmin = async () => {
  try {
    const existingAdmin = await prisma.user.findFirst({
      where: {
        UserRole: UserRole.ADMIN,
      },
    });

    if (!existingAdmin) {
      const defaultEmail = "afmarnob@gmail.com";
      const defaultPassword = "12345678";
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);

      await prisma.$transaction(async (tnx: any) => {
        const user = await tnx.user.create({
          data: {
            email: defaultEmail,
            password: hashedPassword,
            UserRole: UserRole.ADMIN,
            UserStatus: UserStatus.ACTIVE,
          },
        });

        await tnx.admin.create({
          data: {
            name: "Default Admin",
            email: defaultEmail,
            password: hashedPassword,
            userId: user.id,
          },
        });
      });

      console.log(`✅ Default Admin created: ${defaultEmail} / ${defaultPassword}`);
    }
  } catch (error) {
    console.error("❌ Error seeding default admin:", error);
  }
};

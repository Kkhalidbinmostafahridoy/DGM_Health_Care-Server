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

export const seedSpecialtiesAndLinkDoctors = async () => {
  try {
    const defaultSpecialties = [
      { title: "Cardiology", name: "Cardiology", description: "Heart & Cardiovascular Care", icon: "https://cdn-icons-png.flaticon.com/512/2966/2966327.png" },
      { title: "Neurology", name: "Neurology", description: "Brain & Nervous System Care", icon: "https://cdn-icons-png.flaticon.com/512/2966/2966328.png" },
      { title: "General Medicine", name: "General Medicine", description: "Primary Care & Internal Medicine", icon: "https://cdn-icons-png.flaticon.com/512/2966/2966329.png" },
      { title: "Dermatology", name: "Dermatology", description: "Skin, Hair & Nail Health", icon: "https://cdn-icons-png.flaticon.com/512/2966/2966330.png" },
      { title: "Orthopedics", name: "Orthopedics", description: "Bone & Joint Care", icon: "https://cdn-icons-png.flaticon.com/512/2966/2966331.png" },
      { title: "Pediatrics", name: "Pediatrics", description: "Child & Infant Care", icon: "https://cdn-icons-png.flaticon.com/512/2966/2966332.png" }
    ];

    for (const item of defaultSpecialties) {
      const existing = await prisma.specialties.findFirst({
        where: {
          title: { equals: item.title, mode: "insensitive" }
        }
      });

      if (!existing) {
        await prisma.specialties.create({ data: item });
      }
    }

    const allSpecialties = await prisma.specialties.findMany();
    const doctors = await prisma.doctor.findMany({
      include: { doctorSpecialties: true }
    });

    for (const doc of doctors) {
      if (doc.designation) {
        const matchingSpecialty = allSpecialties.find(
          (s) =>
            doc.designation.toLowerCase().includes(s.title.toLowerCase()) ||
            doc.designation.toLowerCase().includes(s.name.toLowerCase()) ||
            (s.title === "General Medicine" && (doc.designation.toLowerCase().includes("medicine") || doc.designation.toLowerCase().includes("senior")))
        );

        if (matchingSpecialty) {
          const isLinked = doc.doctorSpecialties.some(
            (ds) => ds.specialtiesId === matchingSpecialty.id
          );

          if (!isLinked) {
            await prisma.doctorSpecialty.create({
              data: {
                doctorId: doc.id,
                specialtiesId: matchingSpecialty.id
              }
            });
            console.log(`Linked Dr. ${doc.name} (${doc.designation}) -> ${matchingSpecialty.title}`);
          }
        }
      }
    }
  } catch (error) {
    console.error("❌ Error seeding specialties and linking doctors:", error);
  }
};

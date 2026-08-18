// import { PrismaClient } from "@prisma/client";
// import { paginationHelper } from "../../Helper/paginationHelper";
// import { doctorSearchableFields } from "./doctor.content";
// import { equal } from "assert";

// const prisma = new PrismaClient();

// const getAllFromDB = async (filters: any, options: any) => {
//   const { page, limit, sortBy, sortOrder, skip } =
//     paginationHelper.calculatePagination(options);
//   const { searchTerm, ...filterData } = filters;

//   const andConditions: Prisma.DoctorWhereInput[] = [];

//   if (searchTerm) {
//     andConditions.push({
//       OR: doctorSearchableFields.map((field) => ({
//         [field]: {
//           contains: searchTerm,
//           mode: "insensitive",
//         },
//       })),
//     });
//   }

//   if (Object.keys(filterData).length > 0) {
//     const filterConditions = Object.keys(filterData).map((key: any) => ({
//       [key]: {
//         equals: (filterData as any)[key],
//       },
//     }));

//     andConditions.push(...filterConditions);
//   }

//   const whereConditons: Prisma.DoctorWhereInput =
//     andConditions.length > 0 ? { AND: andConditions } : {};

//   const result = await prisma.doctor.findMany({
//     where: whereConditons,
//     skip,
//     take: limit,
//     orderBy: {
//       [sortBy]: sortOrder,
//     },
//   });

//   const total = await prisma.doctor.count({ where: whereConditons });
//   return {
//     meta: {
//       total,
//       page,
//       limit,
//     },
//     data: result,
//   };

//   console.log(page, limit, skip, sortBy, sortOrder);
// };

// export const doctorService = {
//   getAllFromDB,
// };

// doctor.service.ts

import { prisma } from "../../shared/prisma"; // Use shared client instance
import { IOptions, paginationHelper } from "../../Helper/paginationHelper";
import { doctorSearchableFields } from "./doctor.content";
import { Doctor, type Prisma } from "@prisma/client";
import { IDoctorUpdateInput } from "./doctor.Interface";
import { doctorController } from "./doctor.controller";
import ApiErrorHandler from "../../error/apiErrorHandler";
import httpStatus from "http-status";
import { getOpenRouterCompletion } from "../../Helper/openRouter";

const getAllFromDB = async (filters: any, options: IOptions) => {
  const { page, limit, sortBy, sortOrder, skip } =
    paginationHelper.calculatePagination(options);
  const { searchTerm, specialties, ...filterData } = filters;

  const andConditions: Prisma.DoctorWhereInput[] = [];

  // 1. Search term condition (only for String fields)
  if (searchTerm) {
    andConditions.push({
      OR: doctorSearchableFields.map((field) => ({
        [field]: {
          contains: searchTerm,
          mode: "insensitive",
        },
      })),
    });
  }

  // 2. Relational filtering for Specialties (if passed)
  if (specialties && specialties.length > 0) {
    andConditions.push({
      doctorSpecialties: {
        some: {
          specialties: {
            title: {
              contains: specialties,
              mode: "insensitive",
            },
          },
        },
      },
    });
  }

  // 3. Exact match filters for scalar fields
  if (Object.keys(filterData).length > 0) {
    const filterConditions = Object.keys(filterData).map((key) => ({
      [key]: {
        equals: (filterData as Record<string, unknown>)[key],
      },
    }));

    andConditions.push(...filterConditions);
  }

  const whereConditions: Prisma.DoctorWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  // Query Database
  const result = await prisma.doctor.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy:
      sortBy && sortOrder ? { [sortBy]: sortOrder } : { createdAt: "desc" }, // Fallback default sorting
    include: {
      doctorSpecialties: {
        include: {
          specialties: true,
        },
      },
    },
  });

  const total = await prisma.doctor.count({ where: whereConditions });

  return {
    meta: {
      total,
      page,
      limit,
    },
    data: result,
  };
};

const updateIntoDB = async (
  id: string,
  payload: Partial<IDoctorUpdateInput>,
) => {
  const doctorInfo = await prisma.doctor.findUniqueOrThrow({
    where: {
      id,
    },
  });

  const { specialties, ...doctorData } = payload;
  // tnx er kaj multiple operation krtesi ei jnno
  return await prisma.$transaction(async (tnx) => {
    if (specialties && specialties.length > 0) {
      const deleteSpecialtiesIds = specialties.filter(
        (specialty) => specialty.isDeleted,
      );

      for (const specialty of deleteSpecialtiesIds) {
        await tnx.DoctorSpecialty.deleteMany({
          where: {
            doctorId: id,
            specialtiesId: specialty.specialtiesId,
          },
        });
      }

      const createSpecialtiesIds = specialties.filter(
        (specialty) => !specialty.isDeleted,
      );

      for (const specialty of createSpecialtiesIds) {
        const existingSpecialty = await tnx.DoctorSpecialty.findUnique({
          where: {
            specialtiesId_doctorId: {
              specialtiesId: specialty.specialtiesId,
              doctorId: id,
            },
          },
        });

        if (!existingSpecialty) {
          await tnx.DoctorSpecialty.create({
            data: {
              doctorId: id,
              specialtiesId: specialty.specialtiesId,
            },
          });
        }
      }
    }

    const updatedData = await tnx.doctor.update({
      where: {
        id: doctorInfo.id,
      },
      data: doctorData,
      include: {
        doctorSpecialties: {
          include: {
            specialties: true,
          },
        },
      },
    });
    return updatedData;
  });

  // console.log(updatedData);
};

const getAiSuggestion = async (payload: { symptoms: string }) => {
  console.log("========== AI DOCTOR SUGGESTION ==========");

  console.log("Symptoms:", payload.symptoms);

  // =====================================================
  // 1. VALIDATION
  // =====================================================

  if (!payload || !payload.symptoms?.trim()) {
    throw new ApiErrorHandler(httpStatus.BAD_REQUEST, "Symptoms is required!");
  }

  const symptoms = payload.symptoms.trim();

  // =====================================================
  // 2. GET ACTIVE DOCTORS
  // =====================================================

  const doctors = await prisma.doctor.findMany({
    where: {
      isDeleted: false,
    },

    include: {
      doctorSpecialties: {
        include: {
          specialties: true,
        },
      },
    },
  });

  console.log("Available doctors:", doctors.length);

  // =====================================================
  // 3. GET AVAILABLE SPECIALTIES
  // =====================================================

  const specialties = [
    ...new Map(
      doctors
        .flatMap((doctor: any) => doctor.doctorSpecialties)
        .map((doctorSpecialty: any) => [
          doctorSpecialty.specialties.id,

          {
            id: doctorSpecialty.specialties.id,

            title: doctorSpecialty.specialties.title,

            name: doctorSpecialty.specialties.name,
          },
        ]),
    ).values(),
  ];

  console.log("Available specialties:", specialties);

  // =====================================================
  // 4. AI PROMPT
  // =====================================================

  const prompt = `
You are the medical specialty routing AI for DGM Care.

Your task is ONLY to identify the most appropriate medical
specialty for the patient's symptoms.

You are NOT allowed to diagnose the patient.
You are NOT allowed to prescribe medication.

IMPORTANT RULES:

1. Analyze the symptoms independently.
2. Do NOT choose a specialty simply because it is available.
3. The available specialties list is ONLY used to check whether
   DGM Care currently has doctors for the recommended specialty.
4. If none of the available specialties is appropriate,
   return "NO_MATCH".
5. Do NOT force cardiology, dermatology, neurology, etc.
   when the symptoms do not support that specialty.
6. General symptoms such as fever, fatigue, nausea, headache,
   vomiting, body pain, weakness, or flu-like symptoms should
   generally be evaluated by General Medicine/Internal Medicine
   when appropriate.
7. Chest pain, severe breathing difficulty, severe bleeding,
   loss of consciousness, stroke-like symptoms, or other
   potentially serious symptoms should be marked as emergency.
8. Return ONLY valid JSON.
9. Do not return markdown.
10. Do not return \`\`\`json.
11. Do not invent doctor names.
12. Do not invent specialty IDs.

PATIENT SYMPTOMS:

"${symptoms}"

AVAILABLE SPECIALTIES IN DGM CARE:

${JSON.stringify(specialties, null, 2)}

Return exactly this structure:

{
  "status": "MATCH" | "NO_MATCH",
  "specialtyId": "database specialty ID or null",
  "specialtyName": "appropriate specialty name",
  "confidence": 0,
  "reason": "short explanation",
  "emergency": false
}

IMPORTANT:

If the appropriate specialty is General Medicine but
General Medicine is NOT available in the database,
return:

{
  "status": "NO_MATCH",
  "specialtyId": null,
  "specialtyName": "General Medicine",
  "confidence": 0.95,
  "reason": "The symptoms are more appropriate for General Medicine, but no matching specialty is currently available.",
  "emergency": false
}
`;

  // =====================================================
  // 5. CALL OPENROUTER
  // =====================================================

  const aiResponse = await getOpenRouterCompletion(prompt);

  console.log("AI RESPONSE:");
  console.dir(aiResponse, { depth: null });

  if (!aiResponse || !aiResponse.content) {
    throw new ApiErrorHandler(
      httpStatus.INTERNAL_SERVER_ERROR,
      "AI failed to generate a suggestion!",
    );
  }

  // =====================================================
  // 6. GET AI CONTENT
  // =====================================================

  let aiContent =
    typeof aiResponse.content === "string"
      ? aiResponse.content
      : JSON.stringify(aiResponse.content);

  aiContent = aiContent.trim();

  // Remove markdown if model accidentally returns it
  aiContent = aiContent
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  console.log("AI CONTENT:", aiContent);

  // =====================================================
  // 7. PARSE AI RESPONSE
  // =====================================================

  let aiResult: {
    status: "MATCH" | "NO_MATCH";
    specialtyId: string | null;
    specialtyName: string;
    confidence: number;
    reason: string;
    emergency: boolean;
  };

  try {
    aiResult = JSON.parse(aiContent);
  } catch (error) {
    console.error("AI JSON PARSE ERROR:", error);

    console.error("RAW AI CONTENT:", aiContent);

    throw new ApiErrorHandler(
      httpStatus.INTERNAL_SERVER_ERROR,
      "AI returned invalid response!",
    );
  }

  console.log("PARSED AI RESULT:", aiResult);

  // =====================================================
  // 8. VALIDATE AI RESPONSE
  // =====================================================

  if (!aiResult.status || !aiResult.specialtyName) {
    throw new ApiErrorHandler(
      httpStatus.INTERNAL_SERVER_ERROR,
      "AI returned incomplete response!",
    );
  }

  // =====================================================
  // 9. NO MATCH
  // =====================================================

  if (aiResult.status === "NO_MATCH") {
    return {
      symptoms,

      aiSuggestion: {
        specialtyId: null,

        specialtyName: aiResult.specialtyName,

        confidence: aiResult.confidence,

        reason: aiResult.reason,

        emergency: aiResult.emergency,
      },

      doctors: [],

      message: `No ${aiResult.specialtyName} doctor is currently available.`,
    };
  }

  // =====================================================
  // 10. VERIFY SPECIALTY ID
  // =====================================================

  const matchedSpecialty = specialties.find(
    (specialty: any) => specialty.id === aiResult.specialtyId,
  );

  if (!matchedSpecialty) {
    /*
      IMPORTANT:

      Do NOT fall back to another specialty.

      If AI says General Medicine and your database
      doesn't have General Medicine, return NO_MATCH.
    */

    return {
      symptoms,

      aiSuggestion: {
        specialtyId: null,

        specialtyName: aiResult.specialtyName,

        confidence: aiResult.confidence,

        reason: `${aiResult.reason} However, this specialty is not currently available in DGM Care.`,

        emergency: aiResult.emergency,
      },

      doctors: [],

      message: `No ${aiResult.specialtyName} doctor is currently available.`,
    };
  }

  // =====================================================
  // 11. FIND MATCHING DOCTORS
  // =====================================================

  const recommendedDoctors = doctors
    .filter((doctor: any) =>
      doctor.doctorSpecialties.some(
        (doctorSpecialty: any) =>
          doctorSpecialty.specialtiesId === matchedSpecialty.id,
      ),
    )
    .map((doctor: any) => ({
      id: doctor.id,

      name: doctor.name,

      email: doctor.email,

      profilePhoto: doctor.profilePhoto,

      contactNumber: doctor.contactNumber,

      address: doctor.address,

      registrationNumber: doctor.registrationNumber,

      experience: doctor.experience,

      gender: doctor.gender,

      appointmentFee: doctor.appointmentFee,

      qualifications: doctor.qualifications,

      currentlyWorkingAt: doctor.currentlyWorkingAt,

      designation: doctor.designation,

      specialties: doctor.doctorSpecialties.map((doctorSpecialty: any) => ({
        id: doctorSpecialty.specialties.id,

        title: doctorSpecialty.specialties.title,

        name: doctorSpecialty.specialties.name,
      })),
    }));

  // =====================================================
  // 12. RETURN RESULT
  // =====================================================

  return {
    symptoms,

    aiSuggestion: {
      specialtyId: matchedSpecialty.id,

      specialtyName: matchedSpecialty.name,

      confidence: aiResult.confidence,

      reason: aiResult.reason,

      emergency: aiResult.emergency,
    },

    doctors: recommendedDoctors,

    message:
      recommendedDoctors.length > 0
        ? "Doctors recommended successfully."
        : `No ${matchedSpecialty.name} doctor is currently available.`,
  };
};
export const doctorService = {
  getAllFromDB,
  updateIntoDB,
  getAiSuggestion,
};

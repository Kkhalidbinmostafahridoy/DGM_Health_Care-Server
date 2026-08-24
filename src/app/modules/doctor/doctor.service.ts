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
  return await prisma.$transaction(async (tnx: any) => {
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

  // =====================================================
  // 1. VALIDATION
  // =====================================================

  if (!payload || !payload.symptoms?.trim()) {
    throw new ApiErrorHandler(httpStatus.BAD_REQUEST, "Symptoms is required!");
  }

  const symptoms = payload.symptoms.trim();

  console.log("Symptoms:", symptoms);

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

  const dbSpecialties = await prisma.specialties.findMany();

  const specialtiesMap = new Map<
    string,
    { id: string; title: string; name: string }
  >();

  // Add DB specialties
  for (const s of dbSpecialties) {
    specialtiesMap.set(s.id, {
      id: s.id,
      title: s.title,
      name: s.name || s.title,
    });
  }

  // Add linked doctor specialties
  for (const doctor of doctors) {
    for (const ds of doctor.doctorSpecialties) {
      if (ds.specialties) {
        specialtiesMap.set(ds.specialties.id, {
          id: ds.specialties.id,
          title: ds.specialties.title,
          name: ds.specialties.name || ds.specialties.title,
        });
      }
    }
  }

  const specialties = Array.from(specialtiesMap.values());

  console.log("Available specialties:", specialties.length);

  // =====================================================
  // 4. CHECK SPECIALTY AVAILABILITY
  // =====================================================

  if (specialties.length === 0) {
    return {
      symptoms,

      aiSuggestion: {
        specialtyId: null,

        specialtyName: "General Medicine",

        confidence: 0,

        reason:
          "No active doctor specialty is currently available in DGM Care.",

        emergency: false,
      },

      doctors: [],

      message: "No doctor specialties are currently available.",
    };
  }

  console.log("doctor data loaded");

  // =====================================================
  // 5. AI PROMPT
  // =====================================================

  const prompt = `
PATIENT SYMPTOMS:

"${symptoms}"

AVAILABLE SPECIALTIES IN DGM CARE:

${JSON.stringify(specialties, null, 2)}

TASK:

Determine the most appropriate medical specialty for the patient's
symptoms.

IMPORTANT RULES:

1. Analyze the symptoms independently.

2. Do NOT choose a specialty just because it exists in the database.

3. First determine the medically appropriate specialty.

4. Then check whether that specialty exists in AVAILABLE SPECIALTIES.

5. If the appropriate specialty exists:
   return:
   status = "MATCH"
   specialtyId = exact database ID.

6. If the appropriate specialty does NOT exist:
   return:
   status = "NO_MATCH"
   specialtyId = null.

7. NEVER substitute an unrelated specialty.

8. General symptoms such as:
   - fever
   - fatigue
   - nausea
   - headache
   - vomiting
   - body pain
   - weakness
   - flu-like symptoms

   are generally appropriate for General Medicine/Internal Medicine
   when there are no specialty-specific symptoms.

9. Do NOT select Cardiology unless symptoms actually suggest a
   cardiovascular problem.

10. Do NOT select Neurology unless symptoms actually suggest a
    neurological problem.

11. Do NOT select Dermatology unless symptoms involve skin,
    hair, or nails.

12. Chest pain, severe breathing difficulty, severe bleeding,
    loss of consciousness, stroke-like symptoms, or other
    potentially life-threatening symptoms should set:

    emergency = true

13. Do NOT diagnose the disease.

14. Do NOT prescribe medicine.

15. Do NOT invent doctor names.

16. Do NOT invent specialty IDs.

17. confidence must be between 0 and 1.

18. Return ONLY valid JSON.

19. Do NOT return markdown.

20. Do NOT return \`\`\`json.

RETURN EXACTLY:

{
  "status": "MATCH",
  "specialtyId": "database specialty ID or null",
  "specialtyName": "specialty name",
  "confidence": 0,
  "reason": "short explanation",
  "emergency": false
}

If there is no matching specialty in the database, return:

{
  "status": "NO_MATCH",
  "specialtyId": null,
  "specialtyName": "appropriate specialty",
  "confidence": 0.95,
  "reason": "The symptoms are more appropriate for this specialty, but this specialty is not currently available in DGM Care.",
  "emergency": false
}
`;

  // =====================================================
  // 6. CALL OPENROUTER
  // =====================================================

  const aiResponse = await getOpenRouterCompletion(prompt);

  console.log("========== AI RESPONSE ==========");
  console.dir(aiResponse, { depth: null });

  if (!aiResponse || !aiResponse.content) {
    throw new ApiErrorHandler(
      httpStatus.INTERNAL_SERVER_ERROR,
      "AI failed to generate a suggestion!",
    );
  }

  // =====================================================
  // 7. GET AI CONTENT
  // =====================================================

  let aiContent =
    typeof aiResponse.content === "string"
      ? aiResponse.content
      : JSON.stringify(aiResponse.content);

  aiContent = aiContent.trim();

  console.log("RAW AI CONTENT:");
  console.log(aiContent);

  // =====================================================
  // 8. REMOVE MARKDOWN
  // =====================================================

  aiContent = aiContent
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  // =====================================================
  // 9. PARSE JSON
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
    console.error("========== AI JSON PARSE ERROR ==========");
    console.error(error);

    console.error("AI CONTENT:");
    console.error(aiContent);

    throw new ApiErrorHandler(
      httpStatus.INTERNAL_SERVER_ERROR,
      "AI returned invalid JSON response!",
    );
  }

  console.log("========== PARSED AI RESULT ==========");
  console.dir(aiResult, { depth: null });

  // =====================================================
  // 10. VALIDATE AI RESPONSE
  // =====================================================

  if (!aiResult.status || !["MATCH", "NO_MATCH"].includes(aiResult.status)) {
    throw new ApiErrorHandler(
      httpStatus.INTERNAL_SERVER_ERROR,
      "AI returned invalid status!",
    );
  }

  if (!aiResult.specialtyName) {
    throw new ApiErrorHandler(
      httpStatus.INTERNAL_SERVER_ERROR,
      "AI returned incomplete specialty information!",
    );
  }

  if (
    typeof aiResult.confidence !== "number" ||
    aiResult.confidence < 0 ||
    aiResult.confidence > 1
  ) {
    throw new ApiErrorHandler(
      httpStatus.INTERNAL_SERVER_ERROR,
      "AI returned invalid confidence score!",
    );
  }

  if (typeof aiResult.reason !== "string") {
    throw new ApiErrorHandler(
      httpStatus.INTERNAL_SERVER_ERROR,
      "AI returned invalid reason!",
    );
  }

  if (typeof aiResult.emergency !== "boolean") {
    throw new ApiErrorHandler(
      httpStatus.INTERNAL_SERVER_ERROR,
      "AI returned invalid emergency status!",
    );
  }

  // =====================================================
  // 11. EMERGENCY RESPONSE
  // =====================================================

  if (aiResult.emergency === true) {
    return {
      symptoms,

      aiSuggestion: {
        specialtyId: null,

        specialtyName: aiResult.specialtyName,

        confidence: aiResult.confidence,

        reason: aiResult.reason,

        emergency: true,
      },

      doctors: [],

      message:
        "The reported symptoms may require urgent medical attention. Please seek emergency medical care immediately.",
    };
  }

  // =====================================================
  // 12. NO MATCH
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
  // 13. MATCH MUST HAVE SPECIALTY ID
  // =====================================================

  if (!aiResult.specialtyId) {
    throw new ApiErrorHandler(
      httpStatus.INTERNAL_SERVER_ERROR,
      "AI returned MATCH without specialty ID!",
    );
  }

  // =====================================================
  // 14. VERIFY SPECIALTY ID
  // =====================================================

  const matchedSpecialty = specialties.find(
    (specialty: any) => specialty.id === aiResult.specialtyId,
  );

  // =====================================================
  // 15. INVALID / UNAVAILABLE SPECIALTY
  // =====================================================

  if (!matchedSpecialty) {
    console.warn("AI returned unavailable specialty:", aiResult.specialtyId);

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
  // 16. FIND MATCHING DOCTORS
  // =====================================================

  const recommendedDoctors = doctors
    .filter((doctor: any) => {
      const hasDirectSpecialty = doctor.doctorSpecialties.some(
        (doctorSpecialty: any) =>
          doctorSpecialty.specialtiesId === matchedSpecialty.id,
      );
      const designationMatch =
        doctor.designation &&
        ((matchedSpecialty.name &&
          doctor.designation
            .toLowerCase()
            .includes(matchedSpecialty.name.toLowerCase())) ||
          (matchedSpecialty.title &&
            doctor.designation
              .toLowerCase()
              .includes(matchedSpecialty.title.toLowerCase())) ||
          (matchedSpecialty.title === "General Medicine" &&
            (doctor.designation.toLowerCase().includes("medicine") ||
              doctor.designation.toLowerCase().includes("senior"))));

      return hasDirectSpecialty || designationMatch;
    })
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

      specialties: doctor.doctorSpecialties
        .filter((doctorSpecialty: any) => doctorSpecialty.specialties)
        .map((doctorSpecialty: any) => ({
          id: doctorSpecialty.specialties.id,

          title: doctorSpecialty.specialties.title,

          name: doctorSpecialty.specialties.name,
        })),
    }));

  // =====================================================
  // 17. RETURN RESULT
  // =====================================================

  return {
    symptoms,

    aiSuggestion: {
      specialtyId: matchedSpecialty.id,

      specialtyName: matchedSpecialty.name || matchedSpecialty.title,

      confidence: aiResult.confidence,

      reason: aiResult.reason,

      emergency: aiResult.emergency,
    },

    doctors: recommendedDoctors,

    message:
      recommendedDoctors.length > 0
        ? "Doctors recommended successfully."
        : `No ${matchedSpecialty.name || matchedSpecialty.title} doctor is currently available.`,
  };
};

// const getByIdFromDB = async (id: string): Promise<Doctor | null> => {
//   const result = await prisma.doctor.findUnique({
//     where: {
//       id,
//       isDeleted: false,
//     },
//     include: {
//       doctorSpecialties: {
//         include: {
//           specialties: true,
//         },
//       },
//       doctorSchedules: {
//         select: {
//           isBooked: true,
//           schedule: {
//             select: {
//               id: true,
//               startDateTime: true,
//               endDateTime: true,
//             },
//           },
//         },
//       },
//     },
//   });

//   return result;
// };
const getByIdFromDB = async (id: string): Promise<Doctor | null> => {
  const result = await prisma.doctor.findFirst({
    where: {
      id,
      isDeleted: false,
    },
    include: {
      doctorSpecialties: {
        include: {
          specialties: true,
        },
      },
      doctorSchedules: {
        select: {
          doctorId: true,
          scheduleId: true,
          isBooked: true,
          schedule: {
            select: {
              id: true,
              startDateTime: true,
              endDateTime: true,
            },
          },
        },
      },
    },
  });

  return result;
};
export const doctorService = {
  getAllFromDB,
  updateIntoDB,
  getAiSuggestion,
  getByIdFromDB,
};

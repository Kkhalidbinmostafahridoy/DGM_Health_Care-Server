import { UserGender } from "@prisma/client";

export type IDoctorUpdateInput = {
  name?: string;
  email?: string;
  contactNumber?: string | null;
  address?: string;
  registrationNumber?: string;
  gender?: UserGender;
  isDeleted?: boolean;
  qualifications?: string;
  currentlyWorkingAt?: string;
  experience?: string;

  specialties?: {
    specialtiesId: string;
    isDeleted?: boolean;
  }[];
};

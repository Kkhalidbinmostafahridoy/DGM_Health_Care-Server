// doctor.content.ts

// Fields that support `contains` string searching
export const doctorSearchableFields = [
  "name",
  "email",
  "contactNumber",
  "registrationNumber",
];

// All fields allowed for filtering
export const doctorFilterableFields = [
  "email",
  "contactNumber",
  "gender",
  "registrationNumber",
  "appointmentFee",
  "specialties", // Relational filter
  "searchTerm",
  "id",
  "currentlyWorkingAt",
];

export type createPatientPayload = {
  name: string;
  email: string;
  password: string;
  age: number;
  address: string;
  gender: "Male" | "Female"; // must match UserGender enum
};

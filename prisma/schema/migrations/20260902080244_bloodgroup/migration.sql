/*
  Warnings:

  - The values [A,B,AB,O] on the enum `BloodGroup` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "BloodGroup_new" AS ENUM ('A_positive', 'A_negative', 'B_positive', 'B_negative', 'AB_positive', 'AB_negative', 'O_positive', 'O_negative');
ALTER TABLE "patient_health_data" ALTER COLUMN "bloodGroup" TYPE "BloodGroup_new" USING ("bloodGroup"::text::"BloodGroup_new");
ALTER TYPE "BloodGroup" RENAME TO "BloodGroup_old";
ALTER TYPE "BloodGroup_new" RENAME TO "BloodGroup";
DROP TYPE "BloodGroup_old";
COMMIT;

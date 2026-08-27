-- DropIndex
DROP INDEX "prescription_id_key";

-- AlterTable
ALTER TABLE "prescription" ADD CONSTRAINT "prescription_pkey" PRIMARY KEY ("id");

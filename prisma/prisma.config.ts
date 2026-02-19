import { defineConfig } from "@prisma/config";

export default defineConfig({
  client: {
    url: process.env.DATABASE_URL,
  },
  schemaPath: "./prisma/schema/schema.prisma", // ✅ FIXED
});

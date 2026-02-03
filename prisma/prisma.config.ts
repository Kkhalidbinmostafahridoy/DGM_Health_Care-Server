import { defineConfig } from "@prisma/config";

export default defineConfig({
  client: {
    // URL for your Postgres database
    url: process.env.DATABASE_URL,
  },
  // Optional: path to your schema
  schemaPath: "./prisma/schema.prisma",
});

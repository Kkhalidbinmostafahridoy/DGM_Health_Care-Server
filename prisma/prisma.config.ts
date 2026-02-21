const config = {
  client: {
    url: process.env.DATABASE_URL,
  },
  schemaPath: "./prisma/schema/schema.prisma",
};

export default config;

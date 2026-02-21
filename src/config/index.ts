import * as dotenv from "dotenv";
import * as path from "path";
import type { ProcessEnv } from "process";

dotenv.config({ path: path.join(process.cwd(), ".env") });

export default {
  node_env: process.env.NODE_ENV,
  port: process.env.PORT,
  database_url: process.env.DATABASE_URL,
};

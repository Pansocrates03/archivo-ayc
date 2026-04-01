import { SQL } from "bun";

if(!process.env.DATABASE_URL) {
  console.warn("Warning: DATABASE_URL environment variable is not set. Database connection may fail.");
}

export const pg = new SQL(process.env.DATABASE_URL || "");

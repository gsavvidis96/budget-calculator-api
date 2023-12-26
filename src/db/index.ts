import { neon, neonConfig, Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const sql = neon(process.env.DATABASE_URL!);

export const dbHttp = drizzle(sql);

export const createPool = () => {
  return new Pool({ connectionString: process.env.DATABASE_URL! });
};

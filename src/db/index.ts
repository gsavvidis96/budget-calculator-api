import { neon, neonConfig, Pool } from "@neondatabase/serverless";
import { drizzle as drizzleHttp } from "drizzle-orm/neon-http";
import { drizzle as drizzleWs } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";

import ws from "ws";

neonConfig.webSocketConstructor = ws;

const sql = neon(process.env.DATABASE_URL!);

export const db = drizzleHttp(sql, { schema }); // use db for one shot queries over http with low latency

export const createPool = () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
  const db = drizzleWs(pool, { schema });

  return {
    pool,
    db,
  };
}; // for transactions create a pool (using web sockets). Always close the connection inside the handler

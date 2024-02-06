import { Database } from "./types";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { Kysely, PostgresDialect } from "kysely";

import ws from "ws";

neonConfig.webSocketConstructor = ws;

export const getDb = () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
  const db = new Kysely<Database>({ dialect: new PostgresDialect({ pool }) });

  return {
    pool,
    db,
  };
};

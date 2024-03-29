import { Database } from "./types";
import { Pool, neonConfig, types } from "@neondatabase/serverless";
import { Kysely, PostgresDialect } from "kysely";
import ws from "ws";

neonConfig.webSocketConstructor = ws;
types.setTypeParser(types.builtins.NUMERIC, (value) => parseFloat(value)); // return numeric as float
types.setTypeParser(types.builtins.TIMESTAMP, (value) => value.toString()); // return dates as strings
types.setTypeParser(types.builtins.INT8, (value) => parseInt(value)); // return int8 as js int (for count queries)

export const getDb = () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
  const db = new Kysely<Database>({ dialect: new PostgresDialect({ pool }) });

  return {
    pool,
    db,
  };
};

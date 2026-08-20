import { Kysely, PostgresDialect } from "kysely";
import { Pool, types } from "pg";
import type { Database } from "./types";

types.setTypeParser(types.builtins.NUMERIC, (value) =>
  Number.parseFloat(value),
);
types.setTypeParser(types.builtins.INT8, (value) => Number.parseInt(value, 10));

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const db = new Kysely<Database>({
  dialect: new PostgresDialect({ pool }),
});

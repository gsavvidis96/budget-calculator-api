/* THIS IS TO KEEP SUPABASE ALIVE DUE TO FREE TIER CONSTRAINT */

import { db } from "./db";

export const handler = async () => {
  return db.selectFrom("budgets").select("id").limit(1).execute();
};

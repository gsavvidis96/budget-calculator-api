/* THIS IS TO KEEP SUPABASE ALIVE DUE TO FREE TIER CONSTRAINT */

import { db } from "./db";

export const handler = async () => {
  try {
    return db.selectFrom("budgets").selectAll().limit(10).execute();
  } catch (e) {
    console.error(e);
  }
};

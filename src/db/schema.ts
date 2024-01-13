import {
  varchar,
  pgTable,
  text,
  timestamp,
  boolean,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// TODO: Drizzle-feat/updated_at not supported

export const users = pgTable("users", {
  id: varchar("id", { length: 50 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  email: text("email").unique().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const budgets = pgTable("budgets", {
  id: varchar("id", { length: 50 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  title: text("title").unique().notNull(),
  isPinned: boolean("is_pinned").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  userId: varchar("user_id", { length: 50 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
});

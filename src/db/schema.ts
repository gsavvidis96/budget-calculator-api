import {
  varchar,
  pgTable,
  text,
  timestamp,
  boolean,
  numeric,
  pgEnum,
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
  title: text("title").unique().notNull(), // CHECK CONSTRAINT: unique per user
  isPinned: boolean("is_pinned").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  userId: varchar("user_id", { length: 50 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
});

export const BUDGET_ITEMS_TYPES = ["EXPENSES", "INCOME"] as const;

export const budgetItemTypeEnum = pgEnum("type", BUDGET_ITEMS_TYPES);

export const budgetItems = pgTable("budget_items", {
  id: varchar("id", { length: 50 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  description: text("description").notNull(), // CHECK CONSTRAINT: unique description per budget and type
  value: numeric("value").notNull(),
  // CHECK CONSTRAINT: format value with 2 decimal values, value>= 0, budget's balance should not be more than 10000000000000000
  type: budgetItemTypeEnum("type").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  budgetId: varchar("budget_id", { length: 50 })
    .notNull()
    .references(() => budgets.id, { onDelete: "cascade" }),
});

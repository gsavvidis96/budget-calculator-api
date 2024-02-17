import { ColumnType, Selectable } from "kysely";

export interface Database {
  users: UsersTable;
  budgets: BudgetsTable;
  budget_items: BudgetItemsTable;
}

export interface UsersTable {
  id: ColumnType<string, string, never>;
  email: ColumnType<string, string, never>;
  created_at: ColumnType<string, never, never>;
  updated_at: ColumnType<string, never, never>;
}

export interface BudgetsTable {
  id: ColumnType<string, never, never>;
  title: string;
  is_pinned: ColumnType<boolean, boolean | null, boolean | null>;
  user_id: ColumnType<string, string, never>;
  created_at: ColumnType<string, never, never>;
  updated_at: ColumnType<string, never, never>;
}

export const BUDGET_ITEMS_TYPES = ["EXPENSES", "INCOME"] as const;

export interface BudgetItemsTable {
  id: ColumnType<string, never, never>;
  type: (typeof BUDGET_ITEMS_TYPES)[number];
  description: string;
  value: number;
  budget_id: ColumnType<string, string, never>;
  created_at: ColumnType<string, never, never>;
  updated_at: ColumnType<string, never, never>;
}

export type BudgetItem = Selectable<BudgetItemsTable>;

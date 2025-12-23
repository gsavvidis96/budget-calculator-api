import { ColumnType, Generated, GeneratedAlways } from "kysely";

export interface Database {
  budgets: BudgetsTable;
  budget_items: BudgetItemsTable;
}

export interface BudgetsTable {
  id: GeneratedAlways<string>;
  title: string;
  is_pinned: Generated<boolean>;
  user_id: ColumnType<string, string, never>;
  created_at: GeneratedAlways<string>;
  updated_at: GeneratedAlways<string>;
}

export const BUDGET_ITEMS_TYPES = ["EXPENSES", "INCOME"] as const;
export type BudgetItemType = (typeof BUDGET_ITEMS_TYPES)[number];

export interface BudgetItemsTable {
  id: GeneratedAlways<string>;
  type: BudgetItemType;
  description: string;
  value: number;
  budget_id: ColumnType<string, string, never>;
  created_at: GeneratedAlways<string>;
  updated_at: GeneratedAlways<string>;
}

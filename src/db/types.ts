import type { ColumnType, Generated, GeneratedAlways } from "kysely";

export interface Database {
  budgets: BudgetsTable;
  budget_items: BudgetItemsTable;
}

export interface BudgetsTable {
  id: GeneratedAlways<string>;
  title: string;
  is_pinned: Generated<boolean>;
  user_id: ColumnType<string, string, never>;
  created_at: GeneratedAlways<Date>;
  updated_at: GeneratedAlways<Date>;
}

export const BUDGET_ITEM_TYPES = ["EXPENSES", "INCOME"] as const;
export type BudgetItemType = (typeof BUDGET_ITEM_TYPES)[number];

export interface BudgetItemsTable {
  id: GeneratedAlways<string>;
  type: BudgetItemType;
  description: string;
  value: number;
  is_checked: Generated<boolean>;
  position: number;
  budget_id: ColumnType<string, string, never>;
  created_at: GeneratedAlways<Date>;
  updated_at: GeneratedAlways<Date>;
}

import { ColumnType, Generated } from "kysely";

export interface Database {
  users: UserTable;
  budgets: BudgetTable;
}

export interface UserTable {
  id: string;
  email: string;
  created_at: ColumnType<Date, never, never>;
  updated_at: ColumnType<Date, never, never>;
}

export interface BudgetTable {
  id: Generated<string>;
  title: string;
  is_pinned: boolean | null;
  user_id: string;
  created_at: ColumnType<Date, never, never>;
  updated_at: ColumnType<Date, never, never>;
}

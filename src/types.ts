import type { BudgetItemType } from "./db/types";

export type AuthEnv = {
  Variables: {
    user: {
      id: string;
    };
  };
};

export type Budget = {
  id: string;
  title: string;
  isPinned: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
};

export type BudgetSummary = Budget & {
  balance: number;
};

export type BudgetItem = {
  id: string;
  type: BudgetItemType;
  description: string;
  value: number;
  budgetId: string;
  createdAt: string;
  updatedAt: string;
};

export type ExpenseBudgetItem = BudgetItem & {
  expensePercentage: number;
};

export type BudgetDetails = Budget & {
  totalExpenses: number;
  totalIncome: number;
  balance: number;
  expensesPercentage: number;
  expenseItems: ExpenseBudgetItem[];
  incomeItems: BudgetItem[];
};

export type PaginatedBudgets = {
  budgets: BudgetSummary[];
  totalCount: number;
  pageSize: number;
  pageNumber: number;
};

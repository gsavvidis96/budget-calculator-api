import type {
  CreateBudgetInput,
  CreateBudgetItemInput,
  DeleteBudgetInput,
  DeleteBudgetItemInput,
  GetBudgetInput,
  GetBudgetsInput,
  ReorderBudgetItemsInput,
  UpdateBudgetInput,
  UpdateBudgetItemInput,
} from "../schemas/budgets.schema";
import type {
  Budget,
  BudgetDetails,
  BudgetItem,
  ExpenseBudgetItem,
  PaginatedBudgets,
} from "../types";
import * as budgetsRepository from "../repositories/budgets.repository";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../utils/errors";

type BudgetRow = {
  id: string;
  title: string;
  is_pinned: boolean;
  user_id: string;
  created_at: Date | string;
  updated_at: Date | string;
};

type BudgetItemRow = {
  id: string;
  type: BudgetItem["type"];
  description: string;
  value: number;
  is_checked: boolean;
  position: number;
  budget_id: string;
  created_at: Date | string;
  updated_at: Date | string;
};

const serializeTimestamp = (timestamp: Date | string) => {
  return timestamp instanceof Date ? timestamp.toISOString() : timestamp;
};

const mapBudget = (budget: BudgetRow): Budget => ({
  id: budget.id,
  title: budget.title,
  isPinned: budget.is_pinned,
  userId: budget.user_id,
  createdAt: serializeTimestamp(budget.created_at),
  updatedAt: serializeTimestamp(budget.updated_at),
});

const mapBudgetItem = (item: BudgetItemRow): BudgetItem => ({
  id: item.id,
  type: item.type,
  description: item.description,
  value: item.value,
  isChecked: item.is_checked,
  position: item.position,
  budgetId: item.budget_id,
  createdAt: serializeTimestamp(item.created_at),
  updatedAt: serializeTimestamp(item.updated_at),
});

const throwBudgetAccessError = async ({
  userId,
  budgetId,
}: GetBudgetInput): Promise<never> => {
  const budget = await budgetsRepository.findBudget(budgetId);

  if (!budget) {
    throw new NotFoundError("This budget does not exist.");
  }

  if (budget.user_id !== userId) {
    throw new ForbiddenError();
  }

  throw new NotFoundError("This budget does not exist.");
};

const throwBudgetItemAccessError = async ({
  userId,
  budgetId,
  budgetItemId,
}: DeleteBudgetItemInput): Promise<never> => {
  const budget = await budgetsRepository.findBudgetWithItem({
    budgetId,
    budgetItemId,
  });

  if (!budget) {
    throw new NotFoundError("This budget does not exist.");
  }

  if (budget.user_id !== userId) {
    throw new ForbiddenError();
  }

  throw new NotFoundError(
    `This budget item does not exist or is not part of budget with id ${budgetId}`,
  );
};

export const getBudgets = async (
  data: GetBudgetsInput,
): Promise<PaginatedBudgets> => {
  const result = await budgetsRepository.getBudgetsOfUser(data);

  return {
    budgets: result.budgets.map((budget) => ({
      ...mapBudget(budget),
      balance: budget.balance,
    })),
    totalCount: result.totalCount,
    pageSize: data.limit,
    pageNumber: Math.floor(data.offset / data.limit) + 1,
  };
};

export const getBudget = async (
  data: GetBudgetInput,
): Promise<BudgetDetails> => {
  const budget = await budgetsRepository.getBudgetWithDetails(data);

  if (!budget) {
    return throwBudgetAccessError(data);
  }

  return {
    ...mapBudget(budget),
    totalExpenses: budget.total_expenses,
    totalIncome: budget.total_income,
    balance: budget.balance,
    expensesPercentage: budget.expenses_percentage,
    expenseItems: budget.expense_items.map((item): ExpenseBudgetItem => ({
      ...mapBudgetItem(item),
      expensePercentage: item.expense_percentage,
    })),
    incomeItems: budget.income_items.map(mapBudgetItem),
  };
};

export const createBudget = async ({
  userId,
  title,
  isPinned,
}: CreateBudgetInput): Promise<Budget> => {
  const budget = await budgetsRepository.createBudget({
    user_id: userId,
    title,
    ...(isPinned === undefined ? {} : { is_pinned: isPinned }),
  });

  return mapBudget(budget);
};

export const updateBudget = async ({
  userId,
  budgetId,
  title,
  isPinned,
}: UpdateBudgetInput): Promise<Budget> => {
  const budget = await budgetsRepository.updateBudget({
    budgetId,
    userId,
    data: {
      ...(title === undefined ? {} : { title }),
      ...(isPinned === undefined ? {} : { is_pinned: isPinned }),
    },
  });

  if (!budget) {
    return throwBudgetAccessError({ userId, budgetId });
  }

  return mapBudget(budget);
};

export const deleteBudget = async (
  data: DeleteBudgetInput,
): Promise<Budget> => {
  const budget = await budgetsRepository.deleteBudget(data);

  if (!budget) {
    return throwBudgetAccessError(data);
  }

  return mapBudget(budget);
};

export const createBudgetItem = async ({
  userId,
  budgetId,
  description,
  value,
  type,
  isChecked,
}: CreateBudgetItemInput): Promise<BudgetItem> => {
  if (type === "INCOME" && isChecked !== undefined) {
    throw new BadRequestError("Only expense items can be checked");
  }

  const item = await budgetsRepository.createBudgetItem({
    budgetId,
    userId,
    description,
    value,
    type,
    isChecked,
  });

  if (!item) {
    return throwBudgetAccessError({ userId, budgetId });
  }

  return mapBudgetItem(item);
};

export const updateBudgetItem = async ({
  userId,
  budgetId,
  budgetItemId,
  description,
  value,
  isChecked,
}: UpdateBudgetItemInput): Promise<BudgetItem> => {
  if (isChecked !== undefined) {
    const budget = await budgetsRepository.findBudgetWithItem({
      budgetId,
      budgetItemId,
    });

    if (!budget) {
      throw new NotFoundError("This budget does not exist.");
    }

    if (budget.user_id !== userId) {
      throw new ForbiddenError();
    }

    if (!budget.budget_item) {
      throw new NotFoundError(
        `This budget item does not exist or is not part of budget with id ${budgetId}`,
      );
    }

    if (budget.budget_item.type !== "EXPENSES") {
      throw new BadRequestError("Only expense items can be checked");
    }
  }

  const item = await budgetsRepository.updateBudgetItem({
    budgetId,
    budgetItemId,
    userId,
    data: {
      ...(description === undefined ? {} : { description }),
      ...(value === undefined ? {} : { value }),
      ...(isChecked === undefined ? {} : { is_checked: isChecked }),
    },
  });

  if (!item) {
    return throwBudgetItemAccessError({ userId, budgetId, budgetItemId });
  }

  return mapBudgetItem(item);
};

export const deleteBudgetItem = async (
  data: DeleteBudgetItemInput,
): Promise<BudgetItem> => {
  const item = await budgetsRepository.deleteBudgetItem(data);

  if (!item) {
    return throwBudgetItemAccessError(data);
  }

  return mapBudgetItem(item);
};

export const reorderBudgetItems = async (
  data: ReorderBudgetItemsInput,
): Promise<BudgetItem[]> => {
  const result = await budgetsRepository.reorderBudgetItems(data);

  if (result.status === "budget_not_found") {
    return throwBudgetAccessError(data);
  }

  if (result.status === "invalid_items") {
    throw new BadRequestError(
      "Budget item IDs must exactly match the items in the selected type",
    );
  }

  return result.items.map(mapBudgetItem);
};

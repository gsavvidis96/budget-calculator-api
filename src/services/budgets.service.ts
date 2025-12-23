import { ForbiddenError, NotFoundError } from "../utils/errors";
import {
  CreateBudgetInput,
  CreateBudgetItemInput,
  DeleteBudgetItemInput,
  DeleteBudgetInput,
  UpdateBudgetInput,
  UpdateBudgetItemInput,
  GetBudgetInput,
  GetBudgetsQueryInput,
} from "../schemas/budgets.schema";
import * as budgetsRepository from "../repositories/budgets.repository";

// GET BUDGETS
export const getBudgets = async (data: GetBudgetsQueryInput) => {
  return budgetsRepository.getBudgetsOfUser(data);
};

// GET BUDGET
export const getBudget = async ({ user_id, budget_id }: GetBudgetInput) => {
  const budget = await budgetsRepository.findBudget(budget_id);

  if (!budget) {
    throw new NotFoundError("This budget does not exist.");
  }

  if (budget.user_id !== user_id) {
    throw new ForbiddenError();
  }

  return budgetsRepository.getBudgetWithDetails(budget_id);
};

// CREATE BUDGET
export const createBudget = async (data: CreateBudgetInput) => {
  return budgetsRepository.createBudget(data);
};

// UPDATE BUDGET
export const updateBudget = async (data: UpdateBudgetInput) => {
  const { user_id, budget_id, ...budgetData } = data;

  const budget = await budgetsRepository.findBudget(budget_id);

  if (!budget) {
    throw new NotFoundError("This budget does not exist.");
  }

  if (budget.user_id !== user_id) {
    throw new ForbiddenError();
  }

  return budgetsRepository.updateBudget(budget.id, budgetData);
};

// DELETE BUDGET
export const deleteBudget = async ({
  budget_id,
  user_id,
}: DeleteBudgetInput) => {
  const budget = await budgetsRepository.findBudget(budget_id);

  if (!budget) {
    throw new NotFoundError("This budget does not exist.");
  }

  if (budget.user_id !== user_id) {
    throw new ForbiddenError();
  }

  return budgetsRepository.deleteBudget(budget_id);
};

// CREATE BUDGET ITEM
export const createBudgetItem = async (data: CreateBudgetItemInput) => {
  const budget = await budgetsRepository.findBudget(data.budget_id);

  if (!budget) {
    throw new NotFoundError("This budget does not exist.");
  }

  if (budget.user_id !== data.user_id) {
    throw new ForbiddenError();
  }

  const { budget_id, description, type, value } = data;

  return budgetsRepository.createBudgetItem({
    description,
    value,
    type,
    budget_id,
  });
};

// UPDATE BUDGET ITEM
export const updateBudgetItem = async (data: UpdateBudgetItemInput) => {
  const { user_id, budget_id, budget_item_id, ...budgetItemData } = data;

  const budgetWithItem = await budgetsRepository.findBudgetWithItem(
    budget_id,
    budget_item_id,
  );

  if (!budgetWithItem) {
    throw new NotFoundError("This budget does not exist.");
  }

  if (budgetWithItem.user_id !== user_id) {
    throw new ForbiddenError();
  }

  if (!budgetWithItem.budget_item) {
    throw new NotFoundError(
      `This budget item does not exist or is not part of budget with id ${budget_id}`,
    );
  }

  return budgetsRepository.updateBudgetItem(budget_item_id, budgetItemData);
};

// DELETE BUDGET ITEM
export const deleteBudgetItem = async ({
  budget_id,
  user_id,
  budget_item_id,
}: DeleteBudgetItemInput) => {
  const budgetWithItem = await budgetsRepository.findBudgetWithItem(
    budget_id,
    budget_item_id,
  );

  if (!budgetWithItem) {
    throw new NotFoundError("This budget does not exist.");
  }

  if (budgetWithItem.user_id !== user_id) {
    throw new ForbiddenError();
  }

  if (!budgetWithItem.budget_item) {
    throw new NotFoundError(
      `This budget item does not exist or is not part of budget with id ${budget_id}`,
    );
  }

  return budgetsRepository.deleteBudgetItem(budget_item_id);
};

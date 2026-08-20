import { Hono } from "hono";
import authMiddleware from "../middleware/auth.middleware";
import validationMiddleware from "../middleware/validation.middleware";
import {
  budgetIdParamSchema,
  budgetItemIdParamSchema,
  createBudgetItemSchema,
  createBudgetSchema,
  getBudgetsQuerySchema,
  updateBudgetItemSchema,
  updateBudgetSchema,
  type BudgetSortField,
  type SortDirection,
} from "../schemas/budgets.schema";
import * as budgetsService from "../services/budgets.service";
import type {
  AuthEnv,
  Budget,
  BudgetDetails,
  BudgetItem,
  BudgetSummary,
} from "../types";

const budgetsRoutes = new Hono<AuthEnv>();

const toBudgetResponse = (budget: Budget) => ({
  id: budget.id,
  title: budget.title,
  is_pinned: budget.isPinned,
  user_id: budget.userId,
  created_at: budget.createdAt,
  updated_at: budget.updatedAt,
});

const toBudgetSummaryResponse = (budget: BudgetSummary) => ({
  ...toBudgetResponse(budget),
  balance: budget.balance,
});

const toBudgetItemResponse = (item: BudgetItem) => ({
  id: item.id,
  type: item.type,
  description: item.description,
  value: item.value,
  budget_id: item.budgetId,
  created_at: item.createdAt,
  updated_at: item.updatedAt,
});

const toBudgetDetailsResponse = (budget: BudgetDetails) => ({
  total_expenses: budget.totalExpenses,
  total_income: budget.totalIncome,
  balance: budget.balance,
  expenses_percentage: budget.expensesPercentage,
  expense_items: budget.expenseItems.map((item) => ({
    ...toBudgetItemResponse(item),
    expense_percentage: item.expensePercentage,
  })),
  income_items: budget.incomeItems.map(toBudgetItemResponse),
  ...toBudgetResponse(budget),
});

budgetsRoutes.use(authMiddleware);

budgetsRoutes.get(
  "/",
  validationMiddleware("query", getBudgetsQuerySchema),
  async (c) => {
    const { id: userId } = c.get("user");
    const { search, limit, offset, sort } = c.req.valid("query");
    const [transportSortField, sortDirection] = sort.split(":") as [
      "balance" | "created_at",
      SortDirection,
    ];
    const sortField: BudgetSortField =
      transportSortField === "created_at" ? "createdAt" : "balance";

    const result = await budgetsService.getBudgets({
      userId,
      search,
      limit,
      offset,
      sortField,
      sortDirection,
    });

    return c.json({
      budgets: result.budgets.map(toBudgetSummaryResponse),
      total_count: result.totalCount,
      page_size: result.pageSize,
      page_number: result.pageNumber,
    });
  },
);

budgetsRoutes.get(
  "/:id",
  validationMiddleware("param", budgetIdParamSchema),
  async (c) => {
    const { id: userId } = c.get("user");
    const { id: budgetId } = c.req.valid("param");
    const budget = await budgetsService.getBudget({ userId, budgetId });

    return c.json(toBudgetDetailsResponse(budget));
  },
);

budgetsRoutes.post(
  "/",
  validationMiddleware("json", createBudgetSchema),
  async (c) => {
    const { id: userId } = c.get("user");
    const { title, is_pinned: isPinned } = c.req.valid("json");
    const budget = await budgetsService.createBudget({
      userId,
      title,
      isPinned,
    });

    return c.json(toBudgetResponse(budget));
  },
);

budgetsRoutes.patch(
  "/:id",
  validationMiddleware("param", budgetIdParamSchema),
  validationMiddleware("json", updateBudgetSchema),
  async (c) => {
    const { id: userId } = c.get("user");
    const { id: budgetId } = c.req.valid("param");
    const { title, is_pinned: isPinned } = c.req.valid("json");
    const budget = await budgetsService.updateBudget({
      userId,
      budgetId,
      title,
      isPinned,
    });

    return c.json(toBudgetResponse(budget));
  },
);

budgetsRoutes.delete(
  "/:id",
  validationMiddleware("param", budgetIdParamSchema),
  async (c) => {
    const { id: userId } = c.get("user");
    const { id: budgetId } = c.req.valid("param");
    const budget = await budgetsService.deleteBudget({ userId, budgetId });

    return c.json(toBudgetResponse(budget));
  },
);

budgetsRoutes.post(
  "/:id/budget-items",
  validationMiddleware("param", budgetIdParamSchema),
  validationMiddleware("json", createBudgetItemSchema),
  async (c) => {
    const { id: userId } = c.get("user");
    const { id: budgetId } = c.req.valid("param");
    const body = c.req.valid("json");
    const item = await budgetsService.createBudgetItem({
      userId,
      budgetId,
      description: body.description,
      value: body.value,
      type: body.type,
    });

    return c.json(toBudgetItemResponse(item));
  },
);

budgetsRoutes.patch(
  "/:id/budget-items/:budget_item_id",
  validationMiddleware("param", budgetItemIdParamSchema),
  validationMiddleware("json", updateBudgetItemSchema),
  async (c) => {
    const { id: userId } = c.get("user");
    const { id: budgetId, budget_item_id: budgetItemId } = c.req.valid("param");
    const body = c.req.valid("json");
    const item = await budgetsService.updateBudgetItem({
      userId,
      budgetId,
      budgetItemId,
      description: body.description,
      value: body.value,
      type: body.type,
    });

    return c.json(toBudgetItemResponse(item));
  },
);

budgetsRoutes.delete(
  "/:id/budget-items/:budget_item_id",
  validationMiddleware("param", budgetItemIdParamSchema),
  async (c) => {
    const { id: userId } = c.get("user");
    const { id: budgetId, budget_item_id: budgetItemId } = c.req.valid("param");
    const item = await budgetsService.deleteBudgetItem({
      userId,
      budgetId,
      budgetItemId,
    });

    return c.json(toBudgetItemResponse(item));
  },
);

export default budgetsRoutes;

import type { MiddlewareHandler } from "hono";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthEnv } from "../src/types";

const USER_ID = "1cc0e63c-1148-46fc-bc83-b3e6d1789df8";
const BUDGET_ID = "5a4e3ca4-752e-4e52-8458-cb65fbdc2c94";
const ITEM_ID = "4523254d-07b5-4156-86d6-b296b1fb4a36";

const service = vi.hoisted(() => ({
  createBudget: vi.fn(),
  createBudgetItem: vi.fn(),
  deleteBudget: vi.fn(),
  deleteBudgetItem: vi.fn(),
  getBudget: vi.fn(),
  getBudgets: vi.fn(),
  reorderBudgetItems: vi.fn(),
  updateBudget: vi.fn(),
  updateBudgetItem: vi.fn(),
}));

vi.mock("../src/services/budgets.service", () => service);
vi.mock("../src/middleware/auth.middleware", () => {
  const authMiddleware: MiddlewareHandler<AuthEnv> = async (c, next) => {
    c.set("user", { id: USER_ID });
    await next();
  };

  return { default: authMiddleware };
});

import { app } from "../src/app";

const budget = {
  id: BUDGET_ID,
  title: "Monthly budget",
  isPinned: true,
  userId: USER_ID,
  createdAt: "2026-08-19T08:00:00.000Z",
  updatedAt: "2026-08-19T08:00:00.000Z",
};

const incomeItem = {
  id: ITEM_ID,
  type: "INCOME" as const,
  description: "Salary",
  value: 2500,
  position: 0,
  budgetId: BUDGET_ID,
  createdAt: "2026-08-19T08:00:00.000Z",
  updatedAt: "2026-08-19T08:00:00.000Z",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("budget routes", () => {
  it("maps list query and response boundaries", async () => {
    service.getBudgets.mockResolvedValue({
      budgets: [{ ...budget, balance: 1250 }],
      totalCount: 11,
      pageSize: 10,
      pageNumber: 2,
    });

    const response = await app.request(
      "/budgets?limit=10&offset=10&sort=created_at:asc&search=home",
    );

    expect(service.getBudgets).toHaveBeenCalledWith({
      userId: USER_ID,
      limit: 10,
      offset: 10,
      search: "home",
      sortField: "createdAt",
      sortDirection: "asc",
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      budgets: [
        {
          id: BUDGET_ID,
          title: "Monthly budget",
          is_pinned: true,
          user_id: USER_ID,
          created_at: "2026-08-19T08:00:00.000Z",
          updated_at: "2026-08-19T08:00:00.000Z",
          balance: 1250,
        },
      ],
      total_count: 11,
      page_size: 10,
      page_number: 2,
    });
  });

  it("keeps detailed response fields in legacy snake_case", async () => {
    service.getBudget.mockResolvedValue({
      ...budget,
      totalExpenses: 250,
      totalIncome: 2500,
      balance: 2250,
      expensesPercentage: 10,
      expenseItems: [
        {
          ...incomeItem,
          type: "EXPENSES",
          description: "Rent",
          value: 250,
          expensePercentage: 10,
        },
      ],
      incomeItems: [incomeItem],
    });

    const response = await app.request(`/budgets/${BUDGET_ID}`);

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      total_expenses: 250,
      total_income: 2500,
      balance: 2250,
      expenses_percentage: 10,
      is_pinned: true,
      user_id: USER_ID,
      expense_items: [
        {
          budget_id: BUDGET_ID,
          expense_percentage: 10,
        },
      ],
      income_items: [{ budget_id: BUDGET_ID }],
    });
  });

  it("maps a create body to application names and preserves status", async () => {
    service.createBudget.mockResolvedValue(budget);

    const response = await app.request("/budgets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: " Monthly budget ", is_pinned: true }),
    });

    expect(service.createBudget).toHaveBeenCalledWith({
      userId: USER_ID,
      title: "Monthly budget",
      isPinned: true,
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      id: BUDGET_ID,
      title: "Monthly budget",
      is_pinned: true,
      user_id: USER_ID,
      created_at: "2026-08-19T08:00:00.000Z",
      updated_at: "2026-08-19T08:00:00.000Z",
    });
  });

  it("maps budget item path and body fields", async () => {
    service.updateBudgetItem.mockResolvedValue(incomeItem);

    const response = await app.request(
      `/budgets/${BUDGET_ID}/budget-items/${ITEM_ID}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: " Salary ", value: 2500 }),
      },
    );

    expect(service.updateBudgetItem).toHaveBeenCalledWith({
      userId: USER_ID,
      budgetId: BUDGET_ID,
      budgetItemId: ITEM_ID,
      description: "Salary",
      value: 2500,
      type: undefined,
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      id: ITEM_ID,
      budget_id: BUDGET_ID,
      type: "INCOME",
      position: 0,
    });
  });

  it("maps and returns a complete reordered item sequence", async () => {
    service.reorderBudgetItems.mockResolvedValue([incomeItem]);

    const response = await app.request(
      `/budgets/${BUDGET_ID}/budget-items/reorder`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "INCOME",
          budget_item_ids: [ITEM_ID],
        }),
      },
    );

    expect(service.reorderBudgetItems).toHaveBeenCalledWith({
      userId: USER_ID,
      budgetId: BUDGET_ID,
      type: "INCOME",
      budgetItemIds: [ITEM_ID],
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      budget_items: [{ id: ITEM_ID, position: 0 }],
    });
  });

  it("returns standard validation errors before calling the service", async () => {
    const response = await app.request("/budgets?limit=1.5");

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      message: "Validation failed",
      errors: [{ field: "limit" }],
    });
    expect(service.getBudgets).not.toHaveBeenCalled();
  });
});

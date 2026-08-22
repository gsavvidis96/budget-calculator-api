import { beforeEach, describe, expect, it, vi } from "vitest";
import { ForbiddenError, NotFoundError } from "../src/utils/errors";

const repository = vi.hoisted(() => ({
  createBudget: vi.fn(),
  createBudgetItem: vi.fn(),
  deleteBudget: vi.fn(),
  deleteBudgetItem: vi.fn(),
  findBudget: vi.fn(),
  findBudgetWithItem: vi.fn(),
  getBudgetWithDetails: vi.fn(),
  getBudgetsOfUser: vi.fn(),
  reorderBudgetItems: vi.fn(),
  updateBudget: vi.fn(),
  updateBudgetItem: vi.fn(),
}));

vi.mock("../src/repositories/budgets.repository", () => repository);

import * as budgetsService from "../src/services/budgets.service";

const USER_ID = "1cc0e63c-1148-46fc-bc83-b3e6d1789df8";
const OTHER_USER_ID = "62a18818-761f-45f4-aa3d-c35bb855b5bc";
const BUDGET_ID = "5a4e3ca4-752e-4e52-8458-cb65fbdc2c94";
const ITEM_ID = "4523254d-07b5-4156-86d6-b296b1fb4a36";

const budgetRow = {
  id: BUDGET_ID,
  title: "Monthly budget",
  is_pinned: true,
  user_id: USER_ID,
  created_at: "2026-08-19T08:00:00.000Z",
  updated_at: "2026-08-19T08:00:00.000Z",
};

const itemRow = {
  id: ITEM_ID,
  type: "INCOME" as const,
  description: "Salary",
  value: 2500,
  position: 0,
  budget_id: BUDGET_ID,
  created_at: "2026-08-19T08:00:00.000Z",
  updated_at: "2026-08-19T08:00:00.000Z",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("budget service", () => {
  it("maps list rows and calculates a one-based page number", async () => {
    repository.getBudgetsOfUser.mockResolvedValue({
      budgets: [{ ...budgetRow, balance: 1250 }],
      totalCount: 11,
    });

    const result = await budgetsService.getBudgets({
      userId: USER_ID,
      limit: 10,
      offset: 10,
      sortField: "createdAt",
      sortDirection: "desc",
    });

    expect(result).toMatchObject({
      totalCount: 11,
      pageSize: 10,
      pageNumber: 2,
      budgets: [{ userId: USER_ID, isPinned: true, balance: 1250 }],
    });
  });

  it("serializes PostgreSQL Date values at the service boundary", async () => {
    repository.createBudget.mockResolvedValue({
      ...budgetRow,
      created_at: new Date("2026-08-19T08:00:00.000Z"),
      updated_at: new Date("2026-08-19T09:00:00.000Z"),
    });

    await expect(
      budgetsService.createBudget({
        userId: USER_ID,
        title: "Monthly budget",
      }),
    ).resolves.toMatchObject({
      createdAt: "2026-08-19T08:00:00.000Z",
      updatedAt: "2026-08-19T09:00:00.000Z",
    });
  });

  it("maps empty budget totals and item details", async () => {
    repository.getBudgetWithDetails.mockResolvedValue({
      ...budgetRow,
      total_expenses: 0,
      total_income: 0,
      balance: 0,
      expenses_percentage: 0,
      expense_items: [],
      income_items: [],
    });

    await expect(
      budgetsService.getBudget({ userId: USER_ID, budgetId: BUDGET_ID }),
    ).resolves.toMatchObject({
      id: BUDGET_ID,
      totalExpenses: 0,
      totalIncome: 0,
      expenseItems: [],
      incomeItems: [],
    });
  });

  it("rejects a missing budget", async () => {
    repository.findBudget.mockResolvedValue(undefined);

    await expect(
      budgetsService.deleteBudget({ userId: USER_ID, budgetId: BUDGET_ID }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("rejects another user's budget", async () => {
    repository.findBudget.mockResolvedValue({
      id: BUDGET_ID,
      user_id: OTHER_USER_ID,
    });

    await expect(
      budgetsService.createBudgetItem({
        userId: USER_ID,
        budgetId: BUDGET_ID,
        description: "Salary",
        value: 2500,
        type: "INCOME",
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("rejects an item that does not belong to the budget", async () => {
    repository.findBudgetWithItem.mockResolvedValue({
      id: BUDGET_ID,
      user_id: USER_ID,
      budget_item: null,
    });

    await expect(
      budgetsService.deleteBudgetItem({
        userId: USER_ID,
        budgetId: BUDGET_ID,
        budgetItemId: ITEM_ID,
      }),
    ).rejects.toThrow(
      `This budget item does not exist or is not part of budget with id ${BUDGET_ID}`,
    );
  });

  it("checks ownership before updating an item", async () => {
    repository.findBudgetWithItem.mockResolvedValue({
      id: BUDGET_ID,
      user_id: USER_ID,
      budget_item: { id: ITEM_ID },
    });
    repository.updateBudgetItem.mockResolvedValue(itemRow);

    const result = await budgetsService.updateBudgetItem({
      userId: USER_ID,
      budgetId: BUDGET_ID,
      budgetItemId: ITEM_ID,
      description: "Primary salary",
    });

    expect(repository.updateBudgetItem).toHaveBeenCalledWith({
      budgetId: BUDGET_ID,
      budgetItemId: ITEM_ID,
      userId: USER_ID,
      data: { description: "Primary salary" },
    });
    expect(result).toMatchObject({
      id: ITEM_ID,
      budgetId: BUDGET_ID,
      description: "Salary",
    });
  });

  it("maps reordered budget items", async () => {
    repository.reorderBudgetItems.mockResolvedValue({
      status: "success",
      items: [itemRow],
    });

    await expect(
      budgetsService.reorderBudgetItems({
        userId: USER_ID,
        budgetId: BUDGET_ID,
        type: "INCOME",
        budgetItemIds: [ITEM_ID],
      }),
    ).resolves.toMatchObject([{ id: ITEM_ID, position: 0 }]);
  });

  it("rejects a reorder list that does not exactly match the type", async () => {
    repository.reorderBudgetItems.mockResolvedValue({
      status: "invalid_items",
    });

    await expect(
      budgetsService.reorderBudgetItems({
        userId: USER_ID,
        budgetId: BUDGET_ID,
        type: "INCOME",
        budgetItemIds: [],
      }),
    ).rejects.toThrow(
      "Budget item IDs must exactly match the items in the selected type",
    );
  });
});

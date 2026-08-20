import { describe, expect, it } from "vitest";
import {
  budgetIdParamSchema,
  budgetItemIdParamSchema,
  createBudgetItemSchema,
  createBudgetSchema,
  getBudgetsQuerySchema,
  updateBudgetItemSchema,
  updateBudgetSchema,
} from "../src/schemas/budgets.schema";

describe("budget schemas", () => {
  it("applies list defaults", () => {
    expect(getBudgetsQuerySchema.parse({})).toEqual({
      limit: 10,
      offset: 0,
      sort: "created_at:desc",
    });
  });

  it.each([
    { limit: "1.5" },
    { limit: "abc" },
    { limit: "101" },
    { offset: "-1" },
    { offset: "2.5" },
    { sort: "title:asc" },
  ])("rejects malformed list query %#", (query) => {
    expect(getBudgetsQuerySchema.safeParse(query).success).toBe(false);
  });

  it("trims text and rejects blank values", () => {
    expect(createBudgetSchema.parse({ title: "  Home  " }).title).toBe("Home");
    expect(createBudgetSchema.safeParse({ title: "   " }).success).toBe(false);
    expect(
      createBudgetItemSchema.safeParse({
        description: "   ",
        value: 1,
        type: "INCOME",
      }).success,
    ).toBe(false);
  });

  it.each([-1, 0.001, 100_000_000])(
    "rejects invalid money value %s",
    (value) => {
      expect(
        createBudgetItemSchema.safeParse({
          description: "Salary",
          value,
          type: "INCOME",
        }).success,
      ).toBe(false);
    },
  );

  it.each([0, 0.01, 99_999_999.99])("accepts valid money value %s", (value) => {
    expect(
      createBudgetItemSchema.safeParse({
        description: "Salary",
        value,
        type: "INCOME",
      }).success,
    ).toBe(true);
  });

  it("requires at least one patch field", () => {
    expect(updateBudgetSchema.safeParse({}).success).toBe(false);
    expect(updateBudgetItemSchema.safeParse({}).success).toBe(false);
  });

  it("validates both route IDs with distinct field messages", () => {
    expect(budgetIdParamSchema.safeParse({ id: "invalid" }).success).toBe(
      false,
    );

    const result = budgetItemIdParamSchema.safeParse({
      id: "5a4e3ca4-752e-4e52-8458-cb65fbdc2c94",
      budget_item_id: "invalid",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Invalid budget item ID format",
      );
    }
  });
});

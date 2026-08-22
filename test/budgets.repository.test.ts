import { describe, expect, it } from "vitest";
import {
  buildCountBudgetsQuery,
  buildCreateBudgetItemQuery,
  buildGetBudgetWithDetailsQuery,
  buildGetBudgetsQuery,
} from "../src/repositories/budgets.repository";

const USER_ID = "1cc0e63c-1148-46fc-bc83-b3e6d1789df8";
const BUDGET_ID = "5a4e3ca4-752e-4e52-8458-cb65fbdc2c94";

describe("budget repository queries", () => {
  it("builds a filtered, pinned-first, balance-sorted page", () => {
    const compiled = buildGetBudgetsQuery({
      userId: USER_ID,
      search: "home",
      limit: 10,
      offset: 20,
      sortField: "balance",
      sortDirection: "asc",
    }).compile();

    expect(compiled.sql).toContain('where "user_id" = $1');
    expect(compiled.sql).toContain('and "title" ilike $2');
    expect(compiled.sql).toContain(
      'order by "is_pinned" desc, "balance" asc, "id"',
    );
    expect(compiled.sql).not.toContain("COUNT(*) OVER ()");
    expect(compiled.sql).toContain("WHEN type = 'INCOME' THEN value");
    expect(compiled.sql).toContain("WHEN type = 'EXPENSES' THEN value");
    expect(compiled.parameters).toEqual([USER_ID, "%home%", 10, 20]);
  });

  it("maps the application createdAt sort to the database column", () => {
    const compiled = buildGetBudgetsQuery({
      userId: USER_ID,
      limit: 10,
      offset: 0,
      sortField: "createdAt",
      sortDirection: "desc",
    }).compile();

    expect(compiled.sql).toContain(
      'order by "is_pinned" desc, "created_at" desc, "id"',
    );
    expect(compiled.sql).not.toContain('"title" ilike');
  });

  it("builds the detail totals, percentages, and ordered item arrays", () => {
    const compiled = buildGetBudgetWithDetailsQuery({
      budgetId: BUDGET_ID,
      userId: USER_ID,
    }).compile();

    expect(compiled.sql).toContain('with "budget_items_filtered" as');
    expect(compiled.sql).toContain('"totals" as');
    expect(compiled.sql).toContain('"expense_items" as');
    expect(compiled.sql).toContain('"income_items" as');
    expect(compiled.sql).toContain('as "expenses_percentage"');
    expect(compiled.sql).toContain('order by "position", "id"');
    expect(compiled.sql).toContain('where "budgets"."id" =');
    expect(compiled.parameters).toContain(BUDGET_ID);
    expect(compiled.parameters).toContain(USER_ID);
  });

  it("builds an independent count for empty result pages", () => {
    const compiled = buildCountBudgetsQuery({
      userId: USER_ID,
      search: "home",
    }).compile();

    expect(compiled.sql).toContain('count(*) as "total_count"');
    expect(compiled.sql).toContain('where "user_id" = $1');
    expect(compiled.sql).toContain('and "title" ilike $2');
    expect(compiled.parameters).toEqual([USER_ID, "%home%"]);
  });

  it("locks the owned budget while inserting an item", () => {
    const compiled = buildCreateBudgetItemQuery({
      budgetId: BUDGET_ID,
      userId: USER_ID,
      description: "Salary",
      value: 2500,
      type: "INCOME",
    }).compile();

    expect(compiled.sql).toContain('insert into "budget_items"');
    expect(compiled.sql).toContain('where "budgets"."id" =');
    expect(compiled.sql).toContain('and "budgets"."user_id" =');
    expect(compiled.sql).toContain("for key share");
    expect(compiled.sql).toContain("MAX(position)");
    expect(compiled.sql).toContain("returning *");
  });
});

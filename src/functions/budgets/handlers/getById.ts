import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { authenticate } from "../../../helpers/authenticate";
import { handleError } from "../../../helpers/handleError";
import { ForbiddenError } from "../../../errors/forbiddenError";
import { NotFoundError } from "../../../errors/notFoundError";
import { getDb } from "../../../db";
import { jsonArrayFrom } from "kysely/helpers/postgres";
import { sql } from "kysely";

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  const { db, pool } = getDb();

  try {
    const budgetId = event?.pathParameters?.budgetId || "";

    const decodedUser = await authenticate(event.headers);

    const budget = await db
      // calculate filtered budget items for given budgetId
      .with("budget_items_filtered", (db) =>
        db
          .selectFrom("budget_items")
          .where("budget_id", "=", budgetId)
          .selectAll()
      )
      // calculate total income and total expenses
      .with("totals", (db) =>
        db
          .selectFrom("budget_items_filtered")
          .select(() => [
            sql`SUM(CASE WHEN "type" = 'INCOME' THEN "value" ELSE 0 END)`.as(
              "total_income"
            ),
            sql`SUM(CASE WHEN "type" = 'EXPENSES' THEN "value" ELSE 0 END)`.as(
              "total_expenses"
            ),
          ])
      )
      // calculate expense items
      .with("expense_items", (db) =>
        db
          .selectFrom(["budget_items_filtered", "totals"])
          .where("type", "=", "EXPENSES")
          .selectAll()
          .select(() =>
            sql`
          ROUND((value / NULLIF(totals.total_income, 0)) * 100, 2)
          `.as("expense_percentage")
          )
      )
      // calculate income items
      .with("income_items", (db) =>
        db
          .selectFrom("budget_items_filtered")
          .where("type", "=", "INCOME")
          .selectAll()
      )
      .selectFrom(["totals", "budgets"])
      .where("budgets.id", "=", budgetId)
      .select((eb) => [
        eb.fn
          .coalesce("totals.total_expenses", sql<number>`0`)
          .as("total_expenses"),
        eb.fn
          .coalesce("totals.total_income", sql<number>`0`)
          .as("total_income"),
        sql`COALESCE(totals.total_income, 0) - COALESCE(totals.total_expenses, 0)`.as(
          "balance"
        ),
        sql`COALESCE(ROUND(
          (COALESCE(totals.total_expenses, 0) / NULLIF(COALESCE(totals.total_income, 0), 0)) * 100,
          2), 0)`.as("expenses_percentage"),
        jsonArrayFrom(
          eb
            .selectFrom("expense_items")
            .selectAll()
            .whereRef("expense_items.budget_id", "=", "budgets.id")
            .orderBy("created_at")
        ).as("expense_items"),
        jsonArrayFrom(
          eb
            .selectFrom("income_items")
            .selectAll()
            .whereRef("income_items.budget_id", "=", "budgets.id")
            .orderBy("created_at")
        ).as("income_items"),
      ])
      .selectAll("budgets")
      .executeTakeFirst();

    if (!budget) {
      throw new NotFoundError("This budget does not exist.");
    }

    if (budget.user_id !== decodedUser.id) {
      throw new ForbiddenError();
    }

    return {
      statusCode: 200,
      body: JSON.stringify(budget),
    };
  } catch (e: any) {
    return handleError(e);
  } finally {
    pool.end();
  }
};

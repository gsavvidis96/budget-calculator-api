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
      .selectFrom("budgets")
      .where("id", "=", budgetId)
      .selectAll()
      .select((eb) => [
        // EXPENSE_ITEMS
        jsonArrayFrom(
          eb
            .selectFrom("budget_items")
            .selectAll()
            .whereRef("budget_items.budget_id", "=", "budgets.id")
            .where("budget_items.type", "=", "EXPENSES")
        ).as("expense_items"),
        // INCOME ITEMS
        jsonArrayFrom(
          eb
            .selectFrom("budget_items")
            .selectAll()
            .whereRef("budget_items.budget_id", "=", "budgets.id")
            .where("budget_items.type", "=", "INCOME")
        ).as("income_items"),
        // TOTAL_EXPENSES
        eb
          .selectFrom("budget_items")
          .whereRef("budget_items.budget_id", "=", "budgets.id")
          .where("budget_items.type", "=", "EXPENSES")
          .select(({ fn }) =>
            fn
              .coalesce(fn.sum<number>("budget_items.value"), sql<number>`0`)
              .as("total_expenses")
          )
          .as("total_expenses"),
        // TOTAL_INCOME
        eb
          .selectFrom("budget_items")
          .whereRef("budget_items.budget_id", "=", "budgets.id")
          .where("budget_items.type", "=", "INCOME")
          .select(({ fn }) =>
            fn
              .coalesce(fn.sum<number>("budget_items.value"), sql<number>`0`)
              .as("total_income")
          )
          .as("total_income"),
        // BALANCE
        eb
          .selectFrom("budget_items")
          .whereRef("budget_items.budget_id", "=", "budgets.id")
          .select(() =>
            sql`
          COALESCE(SUM(CASE WHEN "type" = 'INCOME' THEN "value" ELSE 0 END), 0) -
          COALESCE(SUM(CASE WHEN "type" = 'EXPENSES' THEN "value" ELSE 0 END), 0)`.as(
              "balance"
            )
          )
          .as("balance"),
      ])
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

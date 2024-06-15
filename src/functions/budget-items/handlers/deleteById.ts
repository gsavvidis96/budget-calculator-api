import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { handleError } from "../../../helpers/handleError";
import { authenticate } from "../../../helpers/authenticate";
import { getDb } from "../../../db";
import { NotFoundError } from "../../../errors/notFoundError";
import { ForbiddenError } from "../../../errors/forbiddenError";
import { jsonObjectFrom } from "kysely/helpers/postgres";

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  const { db, pool } = getDb();

  try {
    const decodedUser = await authenticate(event.headers);
    const budgetId = event?.pathParameters?.budgetId || "";
    const budgetItemId = event?.pathParameters?.budgetItemId || "";

    const foundBudget = await db
      .selectFrom("budgets")
      .where("budgets.id", "=", budgetId)
      .selectAll()
      .select((eb) => [
        jsonObjectFrom(
          eb
            .selectFrom("budget_items")
            .selectAll()
            .whereRef("budget_items.budget_id", "=", "budgets.id")
            .where("budget_items.id", "=", budgetItemId)
        ).as("budget_item"),
      ])
      .executeTakeFirst();

    if (!foundBudget) {
      throw new NotFoundError("This budget does not exist.");
    }

    if (foundBudget.user_id !== decodedUser.id) {
      throw new ForbiddenError();
    }

    if (!foundBudget.budget_item) {
      throw new NotFoundError("This budget item does not exist.");
    }

    const deletedBudgetItem = await db
      .deleteFrom("budget_items")
      .using("budgets")
      .whereRef("budgets.id", "=", "budget_items.budget_id")
      .where((eb) =>
        eb.and({
          "budget_items.id": budgetItemId,
          "budget_items.budget_id": budgetId,
          "budgets.user_id": decodedUser.id,
        })
      )
      .returningAll()
      .executeTakeFirst();

    return {
      statusCode: 200,
      body: JSON.stringify(deletedBudgetItem),
    };
  } catch (e) {
    return handleError(e);
  } finally {
    pool.end();
  }
};

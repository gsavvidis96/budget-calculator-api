import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { authenticate } from "../../../helpers/authenticate";
import { handleError } from "../../../helpers/handleError";
import { getDb } from "../../../db";
import { sql } from "kysely";

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  const { db, pool } = getDb();

  try {
    const decodedUser = await authenticate(event.headers);

    const budgets = await db
      .selectFrom("budgets")
      .where("user_id", "=", decodedUser.id)
      .selectAll()
      .select((eb) =>
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
          .as("balance")
      )
      .execute();

    return {
      statusCode: 200,
      body: JSON.stringify(budgets),
    };
  } catch (e: any) {
    return handleError(e);
  } finally {
    pool.end();
  }
};

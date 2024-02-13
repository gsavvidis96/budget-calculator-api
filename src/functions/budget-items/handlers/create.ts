import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { handleError } from "../../../helpers/handleError";
import { authenticate } from "../../../helpers/authenticate";
import { mixed, number, object, string } from "yup";
import { BUDGET_ITEMS_TYPES, BudgetItem } from "../../../db/types";
import { validateBody } from "../../../helpers/validateBody";
import { getDb } from "../../../db";
import { NotFoundError } from "../../../errors/notFoundError";
import { ForbiddenError } from "../../../errors/forbiddenError";

const bodySchema = object({
  description: string().required(),
  value: number().required().min(0),
  type: mixed<BudgetItem["type"]>().required().oneOf(BUDGET_ITEMS_TYPES),
});

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  const { db, pool } = getDb();

  try {
    const decodedUser = await authenticate(event.headers);
    const budgetId = event?.pathParameters?.budgetId || "";

    const { description, value, type } = await validateBody(
      bodySchema,
      event.body
    );

    const budget = await db
      .selectFrom("budgets")
      .where("id", "=", budgetId)
      .selectAll()
      .executeTakeFirst();

    if (!budget) {
      throw new NotFoundError("This budget does not exist.");
    }

    if (budget.user_id !== decodedUser.id) {
      throw new ForbiddenError();
    }

    const budgetItem = await db
      .insertInto("budget_items")
      .values({
        description,
        value,
        type,
        budget_id: budgetId,
      })
      .returningAll()
      .executeTakeFirst();

    return {
      statusCode: 200,
      body: JSON.stringify(budgetItem),
    };
  } catch (e: any) {
    return handleError(e);
  } finally {
    pool.end();
  }
};

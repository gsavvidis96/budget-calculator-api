import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { authenticate } from "../../../helpers/authenticate";
import { handleError } from "../../../helpers/handleError";
import { ForbiddenError } from "../../../errors/forbiddenError";
import { NotFoundError } from "../../../errors/notFoundError";
import { boolean, object, string } from "yup";
import { validateBody } from "../../../helpers/validateBody";
import { getDb } from "../../../db";

const bodySchema = object({
  title: string(),
  isPinned: boolean(),
});

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  const { db, pool } = getDb();

  try {
    const budgetId = event?.pathParameters?.budgetId || "";
    const decodedUser = await authenticate(event.headers);
    const { title, isPinned } = await validateBody(bodySchema, event.body);

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

    const updatedBudget = await db
      .updateTable("budgets")
      .set({
        title,
        is_pinned: isPinned,
      })
      .where((eb) =>
        eb.and({
          id: budgetId,
          user_id: decodedUser.id,
        })
      )
      .returningAll()
      .executeTakeFirst();

    return {
      statusCode: 200,
      body: JSON.stringify(updatedBudget),
    };
  } catch (e: any) {
    return handleError(e);
  } finally {
    pool.end();
  }
};

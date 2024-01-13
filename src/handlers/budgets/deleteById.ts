import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { authenticate } from "../../helpers/authenticate";
import { handleError } from "../../helpers/handleError";
import { db } from "../../db";
import { budgets } from "../../db/schema";
import { and, eq } from "drizzle-orm";
import { ForbiddenError } from "../../errors/forbiddenError";
import { NotFoundError } from "../../errors/notFoundError";

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    const { budgetId } = event.pathParameters ?? {};

    const decodedUser = await authenticate(event.headers);

    const [budget] = await db
      .select()
      .from(budgets)
      .where(eq(budgets.id, budgetId!));

    if (!budget) {
      throw new NotFoundError("This budget does not exist.");
    }

    if (budget.userId !== decodedUser.id) {
      throw new ForbiddenError();
    }

    const [deletedBudget] = await db
      .delete(budgets)
      .where(and(eq(budgets.id, budgetId!), eq(budgets.userId, decodedUser.id)))
      .returning();

    return {
      statusCode: 200,
      body: JSON.stringify(deletedBudget),
    };
  } catch (e: any) {
    return handleError(e);
  }
};

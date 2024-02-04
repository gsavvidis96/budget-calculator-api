import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { authenticate } from "../../../helpers/authenticate";
import { handleError } from "../../../helpers/handleError";
import { db } from "../../../db";
import { budgets } from "../../../db/schema";
import { and, eq } from "drizzle-orm";
import { ForbiddenError } from "../../../errors/forbiddenError";
import { NotFoundError } from "../../../errors/notFoundError";
import { boolean, object, string } from "yup";
import { validateBody } from "../../../helpers/validateBody";

const bodySchema = object({
  title: string(),
  isPinned: boolean(),
});

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    const budgetId = event?.pathParameters?.budgetId || "";

    const decodedUser = await authenticate(event.headers);

    const { title, isPinned } = await validateBody(bodySchema, event.body);

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

    // TODO: Drizzle-feat/updated_at not supported

    const [updatedBudget] = await db
      .update(budgets)
      .set({ title, isPinned, updatedAt: new Date() })
      .where(and(eq(budgets.id, budgetId), eq(budgets.userId, decodedUser.id)))
      .returning();

    return {
      statusCode: 200,
      body: JSON.stringify(updatedBudget),
    };
  } catch (e: any) {
    return handleError(e);
  }
};

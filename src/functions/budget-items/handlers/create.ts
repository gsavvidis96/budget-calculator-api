import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { db } from "../../../db";
import { BUDGET_ITEMS_TYPES, budgetItems, budgets } from "../../../db/schema";
import { handleError } from "../../../helpers/handleError";
import { authenticate } from "../../../helpers/authenticate";
import { object, string, number, mixed } from "yup";
import { validateBody } from "../../../helpers/validateBody";
import { NotFoundError } from "../../../errors/notFoundError";
import { ForbiddenError } from "../../../errors/forbiddenError";
import { eq } from "drizzle-orm";

const bodySchema = object({
  description: string().required(),
  value: number().required(),
  type: mixed<typeof budgetItems.$inferInsert.type>()
    .required()
    .oneOf(BUDGET_ITEMS_TYPES),
});

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    const decodedUser = await authenticate(event.headers);

    const budgetId = event?.pathParameters?.budgetId || "";

    const { description, value, type } = await validateBody(
      bodySchema,
      event.body
    );

    const [budget] = await db
      .select()
      .from(budgets)
      .where(eq(budgets.id, budgetId));

    if (!budget) {
      throw new NotFoundError("This budget does not exist.");
    }

    if (budget.userId !== decodedUser.id) {
      throw new ForbiddenError();
    }

    const [budgetItem] = await db
      .insert(budgetItems)
      .values({
        value: value.toString(),
        type,
        budgetId,
        description,
      })
      .returning();

    return {
      statusCode: 200,
      body: JSON.stringify(budgetItem),
    };
  } catch (e: any) {
    return handleError(e);
  }
};

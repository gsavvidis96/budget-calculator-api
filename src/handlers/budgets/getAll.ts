import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { db } from "../../db";
import { budgets } from "../../db/schema";
import { eq } from "drizzle-orm";
import { authenticate } from "../../helpers/authenticate";
import { handleError } from "../../helpers/handleError";

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    // TODO: add limit and offset for pagination
    // TODO: add sorting

    const decodedUser = await authenticate(event.headers);

    const foundBudgets = await db
      .select()
      .from(budgets)
      .where(eq(budgets.userId, decodedUser.id));

    return {
      statusCode: 200,
      body: JSON.stringify(foundBudgets),
    };
  } catch (e: any) {
    return handleError(e);
  }
};

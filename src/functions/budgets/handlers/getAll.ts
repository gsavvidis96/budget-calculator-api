import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { authenticate } from "../../../helpers/authenticate";
import { handleError } from "../../../helpers/handleError";
import { getDb } from "../../../db";

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  const { db, pool } = getDb();

  try {
    // TODO: add limit and offset for pagination
    // TODO: add sorting

    const decodedUser = await authenticate(event.headers);

    const budgets = await db
      .selectFrom("budgets")
      .where("user_id", "=", decodedUser.id)
      .selectAll()
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

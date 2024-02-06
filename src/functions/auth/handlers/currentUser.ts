import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { handleError } from "../../../helpers/handleError";
import { authenticate } from "../../../helpers/authenticate";
import { getDb } from "../../../db";

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  const { db, pool } = getDb();

  try {
    const decodedUser = await authenticate(event.headers);

    const user = await db
      .selectFrom("users")
      .where("id", "=", decodedUser.id)
      .selectAll()
      .executeTakeFirst();

    return {
      statusCode: 200,
      body: JSON.stringify(user),
    };
  } catch (e: any) {
    return handleError(e);
  } finally {
    pool.end();
  }
};

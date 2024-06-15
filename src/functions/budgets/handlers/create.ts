import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { handleError } from "../../../helpers/handleError";
import { authenticate } from "../../../helpers/authenticate";
import { boolean, object, string } from "yup";
import { validateBody } from "../../../helpers/validateBody";
import { getDb } from "../../../db";

const bodySchema = object({
  title: string().required(),
  is_pinned: boolean(),
});

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  const { db, pool } = getDb();

  try {
    const decodedUser = await authenticate(event.headers);

    const { title, is_pinned } = await validateBody(bodySchema, event.body);

    const budget = await db
      .insertInto("budgets")
      .values({
        title,
        is_pinned,
        user_id: decodedUser.id,
      })
      .returningAll()
      .executeTakeFirst();

    return {
      statusCode: 200,
      body: JSON.stringify(budget),
    };
  } catch (e) {
    return handleError(e);
  } finally {
    pool.end();
  }
};

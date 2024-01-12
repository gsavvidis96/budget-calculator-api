import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { db } from "../../db";
import { budgets } from "../../db/schema";
import { handleError } from "../../helpers/handleError";
import { authenticate } from "../../helpers/authenticate";
import { object, string } from "yup";
import { validateBody } from "../../helpers/validateBody";

const bodySchema = object({
  title: string().required(),
});

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    const decodedUser = await authenticate(event.headers);

    const { title } = await validateBody(bodySchema, event.body);

    const [budget] = await db
      .insert(budgets)
      .values({ title, userId: decodedUser.id })
      .returning();

    return {
      statusCode: 200,
      body: JSON.stringify(budget),
    };
  } catch (e: any) {
    return handleError(e);
  }
};

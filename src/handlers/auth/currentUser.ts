import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { dbHttp } from "../../db";
import { users } from "../../db/schema";
import { eq } from "drizzle-orm";
import { handleError } from "../../helpers/handleError";
import { authenticate } from "../../helpers/authenticate";

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    const decodedUser = await authenticate(event.headers);

    const [user] = await dbHttp
      .select()
      .from(users)
      .where(eq(users.id, decodedUser.id));

    return {
      statusCode: 200,
      body: JSON.stringify(user),
    };
  } catch (e: any) {
    return handleError(e);
  }
};

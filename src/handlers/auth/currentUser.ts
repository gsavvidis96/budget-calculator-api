import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { dbHttp } from "../../db";
import { users } from "../../db/schema";
import { eq } from "drizzle-orm";

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  const [user] = await dbHttp
    .select()
    .from(users)
    .where(eq(users.email, "tester@test.com"));

  return {
    statusCode: 200,
    body: JSON.stringify({
      user,
    }),
  };
};

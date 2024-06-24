import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import firebaseAuth from "../../../firebaseAuth";
import { object, string } from "yup";
import { validateBody } from "../../../helpers/validateBody";
import { handleError } from "../../../helpers/handleError";
import { NotAuthorizedError } from "../../../errors/notAuthorizedError";
import { getDb } from "../../../db";

const bodySchema = object({
  idToken: string().required(),
});

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  const { db, pool } = getDb();

  try {
    const { idToken } = await validateBody(bodySchema, event.body);

    let decoded;
    let forceRefresh = false;

    try {
      decoded = await firebaseAuth.verifyIdToken(idToken); // decode idToken
    } catch (e) {
      throw new NotAuthorizedError();
    }

    // if user is not verified
    if (!decoded?.userVerified) {
      // usert user in database with the decoded.uid
      await db
        .insertInto("users")
        .values({
          id: decoded.uid,
          email: decoded.email!,
        })
        .onConflict((oc) => oc.doNothing())
        .execute();

      // set custom claims to mark user as verified (entry created in postgres database)
      await firebaseAuth.setCustomUserClaims(decoded.uid, {
        userVerified: true,
      });

      // tell the client to refresh the token for the claims to propagate
      forceRefresh = true;
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ forceRefresh }),
    };
  } catch (e) {
    return handleError(e);
  } finally {
    await pool.end();
  }
};

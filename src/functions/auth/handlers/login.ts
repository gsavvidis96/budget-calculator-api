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

    let firebaseUser;

    try {
      firebaseUser = await firebaseAuth.verifyIdToken(idToken); // verify idToken and get the firebase user
    } catch (e) {
      throw new NotAuthorizedError();
    }

    // upsert user in database with the firebaseUser.uid
    await db
      .insertInto("users")
      .values({
        id: firebaseUser.uid,
        email: firebaseUser.email!,
      })
      .onConflict((oc) => oc.doNothing())
      .execute();

    const additionalClaims = {
      userVerified: true,
    };
    // add additional claims to the custom token issued
    // the userVerified property will be used to differentiate the default firebase idToken with the one issued using our custom token
    // that guarantees that a user record exists in our database

    const customToken = await firebaseAuth.createCustomToken(
      firebaseUser.uid,
      additionalClaims
    ); // create a custom token so the user can re-authenticate with it on the client

    return {
      statusCode: 200,
      body: JSON.stringify({ customToken }),
    };
  } catch (e) {
    return handleError(e);
  } finally {
    await pool.end();
  }
};

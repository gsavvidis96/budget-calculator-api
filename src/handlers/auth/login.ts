import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import firebaseAuth from "../../firebaseAuth";
import { dbHttp } from "../../db";
import { users } from "../../db/schema";

interface Body {
  idToken: string;
}

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  // TODO: validate event.body with middy
  const { idToken } = JSON.parse(event.body!) as Body; // get firebase idToken from body

  let firebaseUser;

  try {
    firebaseUser = await firebaseAuth.verifyIdToken(idToken); // verify idToken and get the firebase user
  } catch (e) {
    // TODO: custom http errors
    throw new Error();
  }

  // upsert user in database with the firebaseUser.uid
  await dbHttp
    .insert(users)
    .values({ id: firebaseUser.uid, email: firebaseUser.email! })
    .onConflictDoNothing({ target: users.id });

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
};

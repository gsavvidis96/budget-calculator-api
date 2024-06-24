import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { handler as loginHandler } from "../functions/auth/handlers/login";
import {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
} from "aws-lambda";

const firebaseApp = initializeApp({
  apiKey: process.env.FIREBASE_API_KEY,
});

const auth = getAuth(firebaseApp);

export const login = async () => {
  try {
    const { user } = await signInWithEmailAndPassword(
      auth,
      process.env.TEST_USER_EMAIL!,
      process.env.TEST_USER_PASSWORD!
    ); // login with firebase

    let idToken = await user.getIdToken(); // get id token

    const result = (await loginHandler({
      body: JSON.stringify({ idToken }),
    } as APIGatewayProxyEventV2)) as APIGatewayProxyStructuredResultV2; // call login to create a user entry if not created

    const { forceRefresh } = JSON.parse(result.body!);

    if (forceRefresh) idToken = await user.getIdToken(true); // refresh token if its user's first login

    return idToken;
  } catch (e) {
    console.error(e);
  }
};

if (require.main === module) {
  (async () => {
    const jwt = await login();
    console.log(jwt);
  })();
}

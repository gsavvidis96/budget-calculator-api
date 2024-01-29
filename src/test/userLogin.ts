import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  signInWithCustomToken,
  connectAuthEmulator,
} from "firebase/auth";
import { handler as loginHandler } from "../functions/auth/handlers/login";
import {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
} from "aws-lambda";

const firebaseApp = initializeApp({
  apiKey: process.env.FIREBASE_API_KEY,
});

const auth = getAuth(firebaseApp);

if (process.env.FIREBASE_AUTH_EMULATOR_HOST)
  connectAuthEmulator(
    auth,
    `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}`
  );

export const login = async () => {
  try {
    const emailAndPasswordResponse = await signInWithEmailAndPassword(
      auth,
      process.env.TEST_USER_EMAIL!,
      process.env.TEST_USER_PASSWORD!
    ); // login with firebase

    let idToken = await emailAndPasswordResponse.user.getIdToken(); // get id token

    const result = (await loginHandler({
      body: JSON.stringify({ idToken }),
    } as APIGatewayProxyEventV2)) as APIGatewayProxyStructuredResultV2; // exchange idToken for custom token

    const { customToken } = JSON.parse(result.body!) as any;

    const customTokenResponse = await signInWithCustomToken(auth, customToken); // re-login with custom token

    idToken = await customTokenResponse.user.getIdToken(); // get id token

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

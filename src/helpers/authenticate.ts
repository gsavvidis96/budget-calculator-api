import { APIGatewayProxyEventHeaders } from "aws-lambda";
import firebaseAuth from "../firebaseAuth";
import { NotAuthorizedError } from "../errors/notAuthorizedError";

export const authenticate = async (headers: APIGatewayProxyEventHeaders) => {
  try {
    const authHeader = headers.authorization || headers.Authorization; // local and deployed versions have different capitalization of "A(a)uthorization"

    const jwt = authHeader?.split(" ")[1]; // get jwt from headers

    let decoded;

    try {
      decoded = await firebaseAuth.verifyIdToken(jwt || ""); // verify jwt
    } catch (e) {
      throw e;
    }

    if (!decoded.userVerified) {
      throw new Error("User is not verified");
    }

    return {
      id: decoded.uid,
      email: decoded.email!,
    };
  } catch (e) {
    console.error(e);

    throw new NotAuthorizedError();
  }
};

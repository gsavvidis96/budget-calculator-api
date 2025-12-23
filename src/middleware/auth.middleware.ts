import { createMiddleware } from "hono/factory";
import { AuthEnv } from "../types";
import { jwtVerify, createRemoteJWKSet } from "jose";
import { UnauthorizedError } from "../utils/errors";

const PROJECT_JWKS = createRemoteJWKSet(
  new URL(`${process.env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`) as URL,
);

const authMiddleware = createMiddleware<AuthEnv>(async (c, next) => {
  try {
    const token = c.req.header("Authorization")?.replace("Bearer ", "");

    if (!token) throw new UnauthorizedError();

    const { payload } = await jwtVerify(token, PROJECT_JWKS);

    if (!payload.sub) throw new UnauthorizedError();

    c.set("user", { id: payload.sub });

    await next();
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      throw e;
    }

    console.error(e);
    throw new UnauthorizedError();
  }
});

export default authMiddleware;

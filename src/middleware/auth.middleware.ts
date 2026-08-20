import { createRemoteJWKSet, jwtVerify } from "jose";
import { createMiddleware } from "hono/factory";
import type { AuthEnv } from "../types";
import { UnauthorizedError } from "../utils/errors";

let projectJwks: ReturnType<typeof createRemoteJWKSet> | undefined;

const getSupabaseUrl = () => {
  const supabaseUrl = process.env.SUPABASE_URL;

  if (!supabaseUrl) {
    throw new Error("SUPABASE_URL is not configured");
  }

  return supabaseUrl.replace(/\/$/, "");
};

const getProjectJwks = () => {
  if (!projectJwks) {
    projectJwks = createRemoteJWKSet(
      new URL(`${getSupabaseUrl()}/auth/v1/.well-known/jwks.json`),
    );
  }

  return projectJwks;
};

const authMiddleware = createMiddleware<AuthEnv>(async (c, next) => {
  try {
    const authorization = c.req.header("Authorization");

    if (!authorization?.startsWith("Bearer ")) {
      throw new UnauthorizedError();
    }

    const token = authorization.slice("Bearer ".length).trim();

    if (!token) {
      throw new UnauthorizedError();
    }

    const supabaseUrl = getSupabaseUrl();
    const { payload } = await jwtVerify(token, getProjectJwks(), {
      audience: "authenticated",
      issuer: `${supabaseUrl}/auth/v1`,
    });

    if (!payload.sub) {
      throw new UnauthorizedError();
    }

    c.set("user", { id: payload.sub });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw error;
    }

    console.error(error);
    throw new UnauthorizedError();
  }

  await next();
});

export default authMiddleware;

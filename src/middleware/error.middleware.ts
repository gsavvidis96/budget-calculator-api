import { ErrorHandler } from "hono";
import { HTTPResponseError } from "hono/types";
import {
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from "../utils/errors";

interface PostgresError extends Error {
  code: string;
  detail?: string;
  table?: string;
  constraint?: string;
}

const isPostgresError = (
  err: Error | HTTPResponseError,
): err is PostgresError => {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    typeof (err as PostgresError).code === "string"
  );
};

const errorMiddleware: ErrorHandler = (err, c) => {
  if (isPostgresError(err)) {
    if (err.code === "23505")
      return c.json({ message: "Resource already exists" }, 409);
  }

  if (err instanceof UnauthorizedError) {
    return c.json({ message: err.message }, 401);
  }

  if (err instanceof ForbiddenError) {
    return c.json({ message: err.message }, 403);
  }

  if (err instanceof NotFoundError) {
    return c.json({ message: err.message }, 404);
  }

  console.error(err);

  return c.json({ message: "Something went wrong" }, 500);
};

export default errorMiddleware;

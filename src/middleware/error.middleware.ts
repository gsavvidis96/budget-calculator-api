import type { ErrorHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import { createErrorResponse } from "../utils/errors";
import { isPostgresError } from "../utils/postgres";

const errorMiddleware: ErrorHandler = (error, c) => {
  if (isPostgresError(error) && error.code === "23505") {
    return c.json(createErrorResponse("Resource already exists"), 409);
  }

  if (error instanceof HTTPException) {
    return c.json(createErrorResponse(error.message), error.status);
  }

  console.error(error);

  return c.json(createErrorResponse("Something went wrong"), 500);
};

export default errorMiddleware;

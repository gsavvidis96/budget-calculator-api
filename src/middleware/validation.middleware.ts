import { zValidator } from "@hono/zod-validator";
import type { ValidationTargets } from "hono";
import type { ZodType } from "zod";
import { createErrorResponse } from "../utils/errors";

const validationMiddleware = <
  T extends ZodType,
  Target extends keyof ValidationTargets,
>(
  target: Target,
  schema: T,
) => {
  return zValidator(target, schema, (result, c) => {
    if (!result.success) {
      return c.json(
        createErrorResponse(
          "Validation failed",
          result.error.issues.map((issue) => ({
            field:
              issue.path.length > 0
                ? issue.path.map(String).join(".")
                : undefined,
            message: issue.message,
          })),
        ),
        400,
      );
    }
  });
};

export default validationMiddleware;

import { zValidator } from "@hono/zod-validator";
import { ValidationTargets } from "hono";
import { ZodType } from "zod";

const validationMiddleware = <
  T extends ZodType,
  Target extends keyof ValidationTargets,
>(
  target: Target,
  schema: T,
) => {
  return zValidator(target, schema, (result, c) => {
    if (!result.success) {
      return c.json(result.error.issues, 400);
    }
  });
};

export default validationMiddleware;

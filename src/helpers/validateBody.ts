import { AnyObject, ObjectSchema, ValidationError } from "yup";
import { RequestValidationError } from "../errors/requestValidationError";

export const validateBody = async <T extends AnyObject>(
  schema: ObjectSchema<T>,
  body?: string
) => {
  try {
    return await schema.validate(JSON.parse(body || "{}"), { strict: true });
  } catch (e: any) {
    if (e instanceof ValidationError) {
      throw new RequestValidationError(e);
    }

    throw e;
  }
};

import { CustomError } from "./customError";

export class ForbiddenError extends CustomError {
  statusCode = 403;

  constructor() {
    super("Forbidden");

    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }

  serializeErrors() {
    return { message: "You do not have permission to access this resource." };
  }
}

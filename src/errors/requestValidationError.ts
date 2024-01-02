import { ValidationError } from "yup";
import { CustomError } from "./customError";

export class RequestValidationError extends CustomError {
  statusCode = 400;

  constructor(public error: ValidationError) {
    super("Invalid request parameters");

    Object.setPrototypeOf(this, RequestValidationError.prototype);
  }

  serializeErrors() {
    return { message: this.error.message, field: this.error.path };
  }
}

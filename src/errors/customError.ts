export abstract class CustomError extends Error {
  abstract statusCode: number;

  constructor(message: string) {
    super(message);

    Object.setPrototypeOf(this, CustomError.prototype);
  }

  // TODO: field from validation
  abstract serializeErrors(): { message: string; field?: string };
}
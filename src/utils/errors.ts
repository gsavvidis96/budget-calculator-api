import { HTTPException } from "hono/http-exception";

export type ErrorDetail = {
  field?: string;
  message: string;
};

export type ErrorResponseBody = {
  message: string;
  errors?: ErrorDetail[];
};

export const createErrorResponse = (
  message: string,
  errors?: ErrorDetail[],
): ErrorResponseBody => {
  return errors?.length ? { message, errors } : { message };
};

export class BadRequestError extends HTTPException {
  constructor(message: string = "Bad request") {
    super(400, { message });
  }
}

export class NotFoundError extends HTTPException {
  constructor(message: string = "Resource not found") {
    super(404, { message });
  }
}

export class UnauthorizedError extends HTTPException {
  constructor(message: string = "Unauthorized") {
    super(401, { message });
  }
}

export class ForbiddenError extends HTTPException {
  constructor(message: string = "You don't have access to this resource") {
    super(403, { message });
  }
}

export class AlreadyExistsError extends HTTPException {
  constructor(message: string = "Resource already exists") {
    super(409, { message });
  }
}

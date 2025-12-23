import { HTTPException } from "hono/http-exception";

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

import { Hono } from "hono";
import { afterEach, describe, expect, it, vi } from "vitest";
import { app as apiApp } from "../src/app";
import authMiddleware from "../src/middleware/auth.middleware";
import errorMiddleware from "../src/middleware/error.middleware";
import validationMiddleware from "../src/middleware/validation.middleware";
import { createBudgetSchema } from "../src/schemas/budgets.schema";
import { BadRequestError } from "../src/utils/errors";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("error responses", () => {
  it("formats validation failures with field details", async () => {
    const app = new Hono();
    app.post("/", validationMiddleware("json", createBudgetSchema), (c) =>
      c.json({ ok: true }),
    );

    const response = await app.request("/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: " " }),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      message: "Validation failed",
      errors: [{ field: "title" }],
    });
  });

  it("formats typed HTTP errors", async () => {
    const app = new Hono();
    app.get("/", () => {
      throw new BadRequestError("Invalid operation");
    });
    app.onError(errorMiddleware);

    const response = await app.request("/");

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ message: "Invalid operation" });
  });

  it("formats unique database conflicts without leaking details", async () => {
    const app = new Hono();
    app.get("/", () => {
      const error = new Error("duplicate secret value") as Error & {
        code: string;
        detail: string;
      };
      error.code = "23505";
      error.detail = "sensitive database detail";
      throw error;
    });
    app.onError(errorMiddleware);

    const response = await app.request("/");

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      message: "Resource already exists",
    });
  });

  it("hides unexpected errors", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const app = new Hono();
    app.get("/", () => {
      throw new Error("database password");
    });
    app.onError(errorMiddleware);

    const response = await app.request("/");

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ message: "Something went wrong" });
  });

  it("returns JSON for unknown routes", async () => {
    const response = await apiApp.request("/missing");

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ message: "Resource not found" });
  });

  it("rejects a missing bearer token without contacting Supabase", async () => {
    const app = new Hono();
    app.use(authMiddleware);
    app.get("/", (c) => c.json({ ok: true }));
    app.onError(errorMiddleware);

    const response = await app.request("/");

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ message: "Unauthorized" });
  });
});

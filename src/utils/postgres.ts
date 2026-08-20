import type { HTTPResponseError } from "hono/types";

export interface PostgresError extends Error {
  code: string;
  constraint?: string;
  detail?: string;
  table?: string;
}

export const isPostgresError = (
  error: Error | HTTPResponseError,
): error is PostgresError => {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
  );
};

import { Hono } from "hono";
import errorMiddleware from "./middleware/error.middleware";
import budgetsRoutes from "./routes/budgets.routes";
import { createErrorResponse } from "./utils/errors";

export const app = new Hono();

app.route("/budgets", budgetsRoutes);
app.notFound((c) => c.json(createErrorResponse("Resource not found"), 404));
app.onError(errorMiddleware);

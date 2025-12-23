import { Hono } from "hono";
import { handle } from "hono/aws-lambda";
import budgetsRoutes from "./routes/budgets.routes";
import errorMiddleware from "./middleware/error.middleware";

const app = new Hono();

app.route("/budgets", budgetsRoutes);

app.onError(errorMiddleware);

export const handler = handle(app);

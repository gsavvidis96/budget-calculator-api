import { Hono } from "hono";
import { AuthEnv } from "../types";
import {
  budgetIdParamSchema,
  budgetItemIdParamSchema,
  createBudgetItemSchema,
  createBudgetSchema,
  getBudgetsQuerySchema,
  updateBudgetItemSchema,
  updateBudgetSchema,
} from "../schemas/budgets.schema";
import authMiddleware from "../middleware/auth.middleware";
import validationMiddleware from "../middleware/validation.middleware";
import * as budgetsService from "../services/budgets.service";

const budgetsRoutes = new Hono<AuthEnv>();

budgetsRoutes.use(authMiddleware);

budgetsRoutes
  // GET BUDGETS
  .get("/", validationMiddleware("query", getBudgetsQuerySchema), async (c) => {
    const { id: user_id } = c.get("user");
    const query = c.req.valid("query");

    const budgets = await budgetsService.getBudgets({
      user_id,
      ...query,
    });

    return c.json(budgets);
  })
  // GET BUDGET
  .get(
    "/:id",
    validationMiddleware("param", budgetIdParamSchema),
    async (c) => {
      const { id: user_id } = c.get("user");
      const { id: budget_id } = c.req.valid("param");

      const budget = await budgetsService.getBudget({
        user_id,
        budget_id,
      });

      return c.json(budget);
    },
  )
  // CREATE BUDGET
  .post("/", validationMiddleware("json", createBudgetSchema), async (c) => {
    const { id: user_id } = c.get("user");
    const body = c.req.valid("json");

    const createdBudget = await budgetsService.createBudget({
      user_id,
      ...body,
    });

    return c.json(createdBudget);
  });
// UPDATE BUDGET
budgetsRoutes
  .patch(
    "/:id",
    validationMiddleware("param", budgetIdParamSchema),
    validationMiddleware("json", updateBudgetSchema),
    async (c) => {
      const { id: user_id } = c.get("user");
      const { id: budget_id } = c.req.valid("param");
      const body = c.req.valid("json");

      const updatedBudget = await budgetsService.updateBudget({
        user_id,
        budget_id,
        ...body,
      });

      return c.json(updatedBudget);
    },
  )
  // DELETE BUDGET
  .delete(
    "/:id",
    validationMiddleware("param", budgetIdParamSchema),
    async (c) => {
      const { id: user_id } = c.get("user");
      const { id: budget_id } = c.req.valid("param");

      const deletedBudget = await budgetsService.deleteBudget({
        user_id,
        budget_id,
      });

      return c.json(deletedBudget);
    },
  )
  // CREATE BUDGET ITEM
  .post(
    "/:id/budget-items",
    validationMiddleware("param", budgetIdParamSchema),
    validationMiddleware("json", createBudgetItemSchema),
    async (c) => {
      const { id: user_id } = c.get("user");
      const { id: budget_id } = c.req.valid("param");
      const body = c.req.valid("json");

      const createdBudgetItem = await budgetsService.createBudgetItem({
        user_id,
        budget_id,
        ...body,
      });

      return c.json(createdBudgetItem);
    },
  )
  // UPDATE BUDGET ITEM
  .patch(
    "/:id/budget-items/:budget_item_id",
    validationMiddleware("param", budgetItemIdParamSchema),
    validationMiddleware("json", updateBudgetItemSchema),
    async (c) => {
      const { id: user_id } = c.get("user");
      const { id: budget_id, budget_item_id } = c.req.valid("param");
      const body = c.req.valid("json");

      const updatedBudgetitem = await budgetsService.updateBudgetItem({
        user_id,
        budget_id,
        budget_item_id,
        ...body,
      });

      return c.json(updatedBudgetitem);
    },
  )
  // DELETE BUDGET ITEM
  .delete(
    "/:id/budget-items/:budget_item_id",
    validationMiddleware("param", budgetItemIdParamSchema),
    async (c) => {
      const { id: user_id } = c.get("user");
      const { id: budget_id, budget_item_id } = c.req.valid("param");

      const deletedBudgetItem = await budgetsService.deleteBudgetItem({
        user_id,
        budget_id,
        budget_item_id,
      });

      return c.json(deletedBudgetItem);
    },
  );

export default budgetsRoutes;

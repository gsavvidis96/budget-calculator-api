import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { handleError } from "../../../helpers/handleError";
import { authenticate } from "../../../helpers/authenticate";
import { mixed, number, object, string } from "yup";
import { BUDGET_ITEMS_TYPES, budgetItems, budgets } from "../../../db/schema";
import { validateBody } from "../../../helpers/validateBody";
import { db } from "../../../db";
import { and, eq, sql } from "drizzle-orm";
import { ForbiddenError } from "../../../errors/forbiddenError";
import { NotFoundError } from "../../../errors/notFoundError";

type Budget = typeof budgets.$inferInsert;
type BudgetItem = typeof budgetItems.$inferInsert;

interface BudgetWithBudgetItems extends Budget {
  budgetItems: BudgetItem[];
}

const bodySchema = object({
  description: string(),
  value: number(),
  type: mixed<typeof budgetItems.$inferInsert.type>().oneOf(BUDGET_ITEMS_TYPES),
});

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    const decodedUser = await authenticate(event.headers);
    const budgetId = event?.pathParameters?.budgetId || "";
    const budgetItemId = event?.pathParameters?.budgetItemId || "";
    const { description, value, type } = await validateBody(
      bodySchema,
      event.body
    );

    // query provided budget and include the provided budget item
    const budgetResult = await db
      .select({
        budget: budgets,
        budgetItems,
      })
      .from(budgets)
      .leftJoin(
        budgetItems,
        and(
          eq(budgets.id, budgetItems.budgetId),
          eq(budgetItems.id, budgetItemId)
        )
      )
      .where(eq(budgets.id, budgetId));

    const budget = budgetResult.reduce<BudgetWithBudgetItems | null>(
      (acc, item) => {
        if (!acc?.id) {
          acc = {
            ...item.budget,
            budgetItems: [],
          };
        }

        if (item.budgetItems) acc.budgetItems.push(item.budgetItems);

        return acc;
      },
      null
    );

    if (!budget) {
      throw new NotFoundError("This budget does not exist.");
    }

    if (budget.userId !== decodedUser.id) {
      throw new ForbiddenError();
    }

    if (!budget.budgetItems[0]) {
      throw new NotFoundError("This budget item does not exist.");
    }

    const updatedBudgetItem = await db.execute(sql`
      UPDATE budget_items
      SET description=${description}
      FROM budgets
      WHERE budget_items.id=${budgetItemId}
      AND budget_items.budget_id=${budgetId}
      AND budgets.user_id=${decodedUser.id}
      RETURNING budget_items.*
    `);

    return {
      statusCode: 200,
      body: JSON.stringify(updatedBudgetItem),
    };
  } catch (e: any) {
    return handleError(e);
  }
};

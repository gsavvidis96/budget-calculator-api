import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { handleError } from "../../../helpers/handleError";
import { authenticate } from "../../../helpers/authenticate";
import { ValidationError, mixed, number, object, string } from "yup";
import { BUDGET_ITEMS_TYPES, BudgetItem } from "../../../db/types";
import { validateBody } from "../../../helpers/validateBody";
import { getDb } from "../../../db";
import { NotFoundError } from "../../../errors/notFoundError";
import { ForbiddenError } from "../../../errors/forbiddenError";
import { jsonObjectFrom } from "kysely/helpers/postgres";
import { areAllValuesUndefined } from "../../../helpers/checkAllValuesUndefined";

const bodySchema = object({
  description: string().min(0),
  value: number().min(0).max(99999999.99),
  type: mixed<BudgetItem["type"]>().oneOf(BUDGET_ITEMS_TYPES),
}).test((fields, context) => {
  if (areAllValuesUndefined(fields))
    return new ValidationError(
      `Please provide at least one of the following: ${Object.keys(
        context.schema.fields
      ).join(", ")}`,
      "",
      "*"
    );

  return true;
});

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  const { db, pool } = getDb();

  try {
    const decodedUser = await authenticate(event.headers);
    const budgetId = event?.pathParameters?.budgetId || "";
    const budgetItemId = event?.pathParameters?.budgetItemId || "";
    const { description, value, type } = await validateBody(
      bodySchema,
      event.body
    );

    const foundBudget = await db
      .selectFrom("budgets")
      .where("budgets.id", "=", budgetId)
      .selectAll()
      .select((eb) => [
        jsonObjectFrom(
          eb
            .selectFrom("budget_items")
            .selectAll()
            .whereRef("budget_items.budget_id", "=", "budgets.id")
            .where("budget_items.id", "=", budgetItemId)
        ).as("budget_item"),
      ])
      .executeTakeFirst();

    if (!foundBudget) {
      throw new NotFoundError("This budget does not exist.");
    }

    if (foundBudget.user_id !== decodedUser.id) {
      throw new ForbiddenError();
    }

    if (!foundBudget.budget_item) {
      throw new NotFoundError("This budget item does not exist.");
    }

    const updatedBudgetItem = await db
      .updateTable("budget_items")
      .set({
        description,
        type,
        value,
      })
      .from("budgets")
      .whereRef("budgets.id", "=", "budget_items.budget_id")
      .where((eb) =>
        eb.and({
          "budget_items.id": budgetItemId,
          "budget_items.budget_id": budgetId,
          "budgets.user_id": decodedUser.id,
        })
      )
      .returning([
        "budget_items.id",
        "budget_items.type",
        "budget_items.description",
        "budget_items.value",
        "budget_items.budget_id",
        "budget_items.created_at",
        "budget_items.updated_at",
      ])
      .executeTakeFirst();

    return {
      statusCode: 200,
      body: JSON.stringify(updatedBudgetItem),
    };
  } catch (e) {
    return handleError(e);
  } finally {
    pool.end();
  }
};

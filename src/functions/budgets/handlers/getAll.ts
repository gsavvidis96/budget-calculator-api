import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { authenticate } from "../../../helpers/authenticate";
import { handleError } from "../../../helpers/handleError";
import { getDb } from "../../../db";
import { sql } from "kysely";

const SORT_BY_VALUES = ["created_at", "updated_at", "balance"];
const SORT_BY_DIRECTION_VALUES = ["asc", "desc"] as const;

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  const { db, pool } = getDb();

  try {
    const decodedUser = await authenticate(event.headers);
    const limit = !isNaN(Number(event?.queryStringParameters?.limit))
      ? Number(event?.queryStringParameters?.limit)
      : 10;
    const offset = !isNaN(Number(event?.queryStringParameters?.offset))
      ? Number(event?.queryStringParameters?.offset)
      : 0;
    const sort = event?.queryStringParameters?.sort || "";
    const [sortBy, sortByDirection] = sort.split(":") as [
      string,
      "asc" | "desc"
    ];

    const { ref } = db.dynamic;

    const response = await db.transaction().execute(async (transaction) => {
      const [budgets, countResponse] = await Promise.all([
        transaction
          .selectFrom("budgets")
          .where("user_id", "=", decodedUser.id)
          .selectAll()
          .select((eb) =>
            eb
              .selectFrom("budget_items")
              .whereRef("budget_items.budget_id", "=", "budgets.id")
              .select(() =>
                sql`
          COALESCE(SUM(CASE WHEN "type" = 'INCOME' THEN "value" ELSE 0 END), 0) -
          COALESCE(SUM(CASE WHEN "type" = 'EXPENSES' THEN "value" ELSE 0 END), 0)`.as(
                  "balance"
                )
              )
              .as("balance")
          )
          .limit(limit)
          .offset(offset)
          .orderBy("is_pinned desc")
          .$if(SORT_BY_VALUES.includes(sortBy), (qb) =>
            qb.orderBy(
              ref(sortBy),
              SORT_BY_DIRECTION_VALUES.includes(sortByDirection)
                ? sortByDirection
                : "asc"
            )
          )
          .execute(),
        transaction
          .selectFrom("budgets")
          .where("user_id", "=", decodedUser.id)
          .select((eb) => eb.fn.countAll().as("count"))
          .executeTakeFirst(),
      ]);

      return {
        budgets,
        total_count: countResponse?.count,
        page_size: limit,
        page_number: offset,
      };
    });

    return {
      statusCode: 200,
      body: JSON.stringify(response),
    };
  } catch (e: any) {
    return handleError(e);
  } finally {
    pool.end();
  }
};

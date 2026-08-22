import type { Insertable, Selectable, Updateable } from "kysely";
import { sql } from "kysely";
import { jsonArrayFrom, jsonObjectFrom } from "kysely/helpers/postgres";
import { db } from "../db";
import type { BudgetItemsTable, BudgetsTable } from "../db/types";
import type { BudgetSortField, SortDirection } from "../schemas/budgets.schema";

export const createBudget = async (data: Insertable<BudgetsTable>) => {
  return db
    .insertInto("budgets")
    .values(data)
    .returningAll()
    .executeTakeFirstOrThrow();
};

export const findBudget = async (budgetId: string) => {
  return db
    .selectFrom("budgets")
    .select(["id", "user_id"])
    .where("id", "=", budgetId)
    .executeTakeFirst();
};

export const updateBudget = async ({
  budgetId,
  userId,
  data,
}: {
  budgetId: string;
  userId: string;
  data: Updateable<BudgetsTable>;
}) => {
  return db
    .updateTable("budgets")
    .set(data)
    .where("id", "=", budgetId)
    .where("user_id", "=", userId)
    .returningAll()
    .executeTakeFirst();
};

export const deleteBudget = async ({
  budgetId,
  userId,
}: {
  budgetId: string;
  userId: string;
}) => {
  return db
    .deleteFrom("budgets")
    .where("id", "=", budgetId)
    .where("user_id", "=", userId)
    .returningAll()
    .executeTakeFirst();
};

type CreateBudgetItemRepositoryInput = {
  budgetId: string;
  userId: string;
  description: string;
  value: number;
  type: BudgetItemsTable["type"];
};

export const buildCreateBudgetItemQuery = ({
  budgetId,
  userId,
  description,
  value,
  type,
}: CreateBudgetItemRepositoryInput) => {
  return db
    .insertInto("budget_items")
    .columns(["budget_id", "description", "value", "type", "position"])
    .expression((eb) =>
      eb
        .selectFrom("budgets")
        .select([
          "budgets.id",
          eb.val(description).as("description"),
          eb.val(value).as("value"),
          eb.val(type).as("type"),
          sql<number>`
            COALESCE(
              (
                SELECT
                  MAX(position)
                FROM
                  budget_items
                WHERE
                  budget_id = budgets.id
                  AND type = ${type}
              ),
              -1
            ) + 1
          `.as("position"),
        ])
        .where("budgets.id", "=", budgetId)
        .where("budgets.user_id", "=", userId)
        .forKeyShare(),
    )
    .returningAll();
};

export const createBudgetItem = async (
  data: CreateBudgetItemRepositoryInput,
) => {
  return db.transaction().execute(async (transaction) => {
    const budget = await transaction
      .selectFrom("budgets")
      .select("id")
      .where("id", "=", data.budgetId)
      .where("user_id", "=", data.userId)
      .forUpdate()
      .executeTakeFirst();

    if (!budget) {
      return undefined;
    }

    const lastItem = await transaction
      .selectFrom("budget_items")
      .select((eb) => eb.fn.max<number>("position").as("position"))
      .where("budget_id", "=", data.budgetId)
      .where("type", "=", data.type)
      .executeTakeFirstOrThrow();

    return transaction
      .insertInto("budget_items")
      .values({
        budget_id: data.budgetId,
        description: data.description,
        value: data.value,
        type: data.type,
        position: (lastItem.position ?? -1) + 1,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  });
};

export const findBudgetWithItem = async ({
  budgetId,
  budgetItemId,
}: {
  budgetId: string;
  budgetItemId: string;
}) => {
  return db
    .selectFrom("budgets")
    .select(["budgets.id", "budgets.user_id"])
    .select((eb) => [
      jsonObjectFrom(
        eb
          .selectFrom("budget_items")
          .select("budget_items.id")
          .whereRef("budget_items.budget_id", "=", "budgets.id")
          .where("budget_items.id", "=", budgetItemId),
      ).as("budget_item"),
    ])
    .where("budgets.id", "=", budgetId)
    .executeTakeFirst();
};

export const updateBudgetItem = async ({
  budgetId,
  budgetItemId,
  userId,
  data,
}: {
  budgetId: string;
  budgetItemId: string;
  userId: string;
  data: Updateable<BudgetItemsTable>;
}) => {
  return db
    .updateTable("budget_items")
    .set(data)
    .where("id", "=", budgetItemId)
    .where(
      "budget_id",
      "in",
      db
        .selectFrom("budgets")
        .select("id")
        .where("id", "=", budgetId)
        .where("user_id", "=", userId),
    )
    .returningAll()
    .executeTakeFirst();
};

export const deleteBudgetItem = async ({
  budgetId,
  budgetItemId,
  userId,
}: {
  budgetId: string;
  budgetItemId: string;
  userId: string;
}) => {
  return db.transaction().execute(async (transaction) => {
    const budget = await transaction
      .selectFrom("budgets")
      .select("id")
      .where("id", "=", budgetId)
      .where("user_id", "=", userId)
      .forUpdate()
      .executeTakeFirst();

    if (!budget) {
      return undefined;
    }

    const item = await transaction
      .deleteFrom("budget_items")
      .where("id", "=", budgetItemId)
      .where("budget_id", "=", budgetId)
      .returningAll()
      .executeTakeFirst();

    if (!item) {
      return undefined;
    }

    await sql`
      SET CONSTRAINTS budget_items_budget_type_position_unique DEFERRED
    `.execute(transaction);

    await transaction
      .updateTable("budget_items")
      .set({ position: sql<number>`position - 1` })
      .where("budget_id", "=", budgetId)
      .where("type", "=", item.type)
      .where("position", ">", item.position)
      .execute();

    return item;
  });
};

export type ReorderBudgetItemsRepositoryResult =
  | { status: "success"; items: Selectable<BudgetItemsTable>[] }
  | { status: "budget_not_found" }
  | { status: "invalid_items" };

export const reorderBudgetItems = async ({
  budgetId,
  userId,
  type,
  budgetItemIds,
}: {
  budgetId: string;
  userId: string;
  type: BudgetItemsTable["type"];
  budgetItemIds: string[];
}): Promise<ReorderBudgetItemsRepositoryResult> => {
  return db.transaction().execute(async (transaction) => {
    const budget = await transaction
      .selectFrom("budgets")
      .select("id")
      .where("id", "=", budgetId)
      .where("user_id", "=", userId)
      .forUpdate()
      .executeTakeFirst();

    if (!budget) {
      return { status: "budget_not_found" };
    }

    const currentItems = await transaction
      .selectFrom("budget_items")
      .select("id")
      .where("budget_id", "=", budgetId)
      .where("type", "=", type)
      .forUpdate()
      .execute();
    const submittedIds = new Set(budgetItemIds);

    if (
      submittedIds.size !== budgetItemIds.length ||
      currentItems.length !== budgetItemIds.length ||
      currentItems.some((item) => !submittedIds.has(item.id))
    ) {
      return { status: "invalid_items" };
    }

    await sql`
      SET CONSTRAINTS budget_items_budget_type_position_unique DEFERRED
    `.execute(transaction);

    for (const [position, budgetItemId] of budgetItemIds.entries()) {
      await transaction
        .updateTable("budget_items")
        .set({ position })
        .where("id", "=", budgetItemId)
        .where("budget_id", "=", budgetId)
        .where("type", "=", type)
        .execute();
    }

    const items = await transaction
      .selectFrom("budget_items")
      .selectAll()
      .where("budget_id", "=", budgetId)
      .where("type", "=", type)
      .orderBy("position")
      .orderBy("id")
      .execute();

    return { status: "success", items };
  });
};

export const buildGetBudgetWithDetailsQuery = ({
  budgetId,
  userId,
}: {
  budgetId: string;
  userId: string;
}) => {
  return db
    .with("budget_items_filtered", (database) =>
      database
        .selectFrom("budget_items")
        .selectAll()
        .where("budget_id", "=", budgetId),
    )
    .with("totals", (database) =>
      database.selectFrom("budget_items_filtered").select([
        sql<number>`
          SUM(
            CASE
              WHEN type = 'INCOME' THEN value
              ELSE 0
            END
          )
        `.as("total_income"),
        sql<number>`
          SUM(
            CASE
              WHEN type = 'EXPENSES' THEN value
              ELSE 0
            END
          )
        `.as("total_expenses"),
      ]),
    )
    .with("expense_items", (database) =>
      database
        .selectFrom(["budget_items_filtered", "totals"])
        .selectAll("budget_items_filtered")
        .select(
          sql<number>`
            COALESCE(
              ROUND((value / NULLIF(totals.total_income, 0)) * 100, 2),
              0
            )
          `.as("expense_percentage"),
        )
        .where("type", "=", "EXPENSES"),
    )
    .with("income_items", (database) =>
      database
        .selectFrom("budget_items_filtered")
        .selectAll()
        .where("type", "=", "INCOME"),
    )
    .selectFrom(["totals", "budgets"])
    .select((eb) => [
      eb.fn
        .coalesce("totals.total_expenses", sql<number>`0`)
        .as("total_expenses"),
      eb.fn.coalesce("totals.total_income", sql<number>`0`).as("total_income"),
      sql<number>`
        COALESCE(totals.total_income, 0) - COALESCE(totals.total_expenses, 0)
      `.as("balance"),
      sql<number>`
        COALESCE(
          ROUND(
            (
              COALESCE(totals.total_expenses, 0) / NULLIF(COALESCE(totals.total_income, 0), 0)
            ) * 100,
            2
          ),
          0
        )
      `.as("expenses_percentage"),
      jsonArrayFrom(
        eb
          .selectFrom("expense_items")
          .selectAll("expense_items")
          .whereRef("expense_items.budget_id", "=", "budgets.id")
          .orderBy("position")
          .orderBy("id"),
      ).as("expense_items"),
      jsonArrayFrom(
        eb
          .selectFrom("income_items")
          .selectAll("income_items")
          .whereRef("income_items.budget_id", "=", "budgets.id")
          .orderBy("position")
          .orderBy("id"),
      ).as("income_items"),
    ])
    .selectAll("budgets")
    .where("budgets.id", "=", budgetId)
    .where("budgets.user_id", "=", userId);
};

export const getBudgetWithDetails = async ({
  budgetId,
  userId,
}: {
  budgetId: string;
  userId: string;
}) => {
  return buildGetBudgetWithDetailsQuery({
    budgetId,
    userId,
  }).executeTakeFirst();
};

type GetBudgetsRepositoryInput = {
  userId: string;
  search?: string;
  limit: number;
  offset: number;
  sortField: BudgetSortField;
  sortDirection: SortDirection;
};

export const buildGetBudgetsQuery = ({
  userId,
  search,
  limit,
  offset,
  sortField,
  sortDirection,
}: GetBudgetsRepositoryInput) => {
  const sortColumn = sortField === "createdAt" ? "created_at" : "balance";

  return db
    .selectFrom("budgets")
    .selectAll()
    .select((eb) => [
      eb.fn
        .coalesce(
          eb
            .selectFrom("budget_items")
            .select(
              sql<number>`
                COALESCE(
                  SUM(
                    CASE
                      WHEN type = 'INCOME' THEN value
                      ELSE 0
                    END
                  ),
                  0
                ) - COALESCE(
                  SUM(
                    CASE
                      WHEN type = 'EXPENSES' THEN value
                      ELSE 0
                    END
                  ),
                  0
                )
              `.as("balance"),
            )
            .whereRef("budget_items.budget_id", "=", "budgets.id"),
          sql<number>`0`,
        )
        .as("balance"),
    ])
    .where("user_id", "=", userId)
    .$if(Boolean(search), (query) =>
      query.where("title", "ilike", `%${search}%`),
    )
    .orderBy("is_pinned", "desc")
    .orderBy(sortColumn, sortDirection)
    .orderBy("id")
    .limit(limit)
    .offset(offset);
};

export const buildCountBudgetsQuery = ({
  userId,
  search,
}: Pick<GetBudgetsRepositoryInput, "userId" | "search">) => {
  return db
    .selectFrom("budgets")
    .select((eb) => eb.fn.countAll<number>().as("total_count"))
    .where("user_id", "=", userId)
    .$if(Boolean(search), (query) =>
      query.where("title", "ilike", `%${search}%`),
    );
};

export const getBudgetsOfUser = async (data: GetBudgetsRepositoryInput) => {
  const [budgets, countResult] = await Promise.all([
    buildGetBudgetsQuery(data).execute(),
    buildCountBudgetsQuery(data).executeTakeFirstOrThrow(),
  ]);

  return {
    budgets,
    totalCount: countResult.total_count,
  };
};

import { jsonArrayFrom, jsonObjectFrom } from "kysely/helpers/postgres";
import { db } from "../db";
import { BudgetItemsTable, BudgetsTable } from "../db/types";
import { Insertable, Updateable } from "kysely";
import { sql } from "kysely";
import {
  GetBudgetsQueryInput,
  SupportedFields,
} from "../schemas/budgets.schema";

export const createBudget = async (data: Insertable<BudgetsTable>) => {
  return db
    .insertInto("budgets")
    .values(data)
    .returningAll()
    .executeTakeFirst();
};

export const findBudget = async (budget_id: string) => {
  return db
    .selectFrom("budgets")
    .where("id", "=", budget_id)
    .selectAll()
    .executeTakeFirst();
};

export const updateBudget = async (
  budget_id: string,
  data: Updateable<BudgetsTable>,
) => {
  return db
    .updateTable("budgets")
    .set(data)
    .where("id", "=", budget_id)
    .returningAll()
    .executeTakeFirst();
};

export const deleteBudget = async (budget_id: string) => {
  return db
    .deleteFrom("budgets")
    .where("id", "=", budget_id)
    .returningAll()
    .executeTakeFirst();
};

export const createBudgetItem = async (data: Insertable<BudgetItemsTable>) => {
  return db
    .insertInto("budget_items")
    .values(data)
    .returningAll()
    .executeTakeFirst();
};

export const findBudgetWithItem = async (
  budget_id: string,
  budget_item_id: string,
) => {
  return db
    .selectFrom("budgets")
    .where("budgets.id", "=", budget_id)
    .selectAll()
    .select((eb) => [
      jsonObjectFrom(
        eb
          .selectFrom("budget_items")
          .selectAll()
          .whereRef("budget_items.budget_id", "=", "budgets.id")
          .where("budget_items.id", "=", budget_item_id),
      ).as("budget_item"),
    ])
    .executeTakeFirst();
};

export const updateBudgetItem = async (
  budget_item_id: string,
  data: Updateable<BudgetItemsTable>,
) => {
  return db
    .updateTable("budget_items")
    .set(data)
    .where("id", "=", budget_item_id)
    .returningAll()
    .executeTakeFirst();
};

export const deleteBudgetItem = async (budget_item_id: string) => {
  return db
    .deleteFrom("budget_items")
    .where("id", "=", budget_item_id)
    .returningAll()
    .executeTakeFirst();
};

export const getBudgetWithDetails = async (budget_id: string) => {
  return (
    db
      // calculate filtered budget items for given budgetId
      .with("budget_items_filtered", (db) =>
        db
          .selectFrom("budget_items")
          .where("budget_id", "=", budget_id)
          .selectAll(),
      )
      // calculate total income and total expenses
      .with("totals", (db) =>
        db.selectFrom("budget_items_filtered").select([
          sql<number> /*sql*/ `
            SUM(
              CASE
                WHEN type = 'INCOME' THEN value
                ELSE 0
              END
            )
          `.as("total_income"),
          sql<number> /*sql*/ `
            SUM(
              CASE
                WHEN type = 'EXPENSES' THEN value
                ELSE 0
              END
            )
          `.as("total_expenses"),
        ]),
      )
      // calculate expense items
      .with("expense_items", (db) =>
        db
          .selectFrom(["budget_items_filtered", "totals"])
          .where("type", "=", "EXPENSES")
          .selectAll("budget_items_filtered")
          .select(
            sql<number> /*sql*/ `
              COALESCE(
                ROUND((value / NULLIF(totals.total_income, 0)) * 100, 2),
                0
              )
            `.as("expense_percentage"),
          ),
      )
      // calculate income items
      .with("income_items", (db) =>
        db
          .selectFrom("budget_items_filtered")
          .where("type", "=", "INCOME")
          .selectAll(),
      )
      .selectFrom(["totals", "budgets"])
      .where("budgets.id", "=", budget_id)
      .select((eb) => [
        eb.fn
          .coalesce("totals.total_expenses", sql<number>`0`)
          .as("total_expenses"),
        eb.fn
          .coalesce("totals.total_income", sql<number>`0`)
          .as("total_income"),
        sql<number> /*sql*/ `
          COALESCE(totals.total_income, 0) - COALESCE(totals.total_expenses, 0)
        `.as("balance"),
        sql<number> /*sql*/ `
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
            .orderBy("created_at"),
        ).as("expense_items"),
        jsonArrayFrom(
          eb
            .selectFrom("income_items")
            .selectAll("income_items")
            .whereRef("income_items.budget_id", "=", "budgets.id")
            .orderBy("created_at"),
        ).as("income_items"),
      ])
      .selectAll("budgets")
      .executeTakeFirst()
  );
};

export const getBudgetsOfUser = async ({
  user_id,
  search,
  limit,
  offset,
  sort,
}: GetBudgetsQueryInput) => {
  const [sortBy, sortByDirection] = sort.split(":") as [
    SupportedFields,
    "asc" | "desc",
  ];

  const budgets = await db
    .selectFrom("budgets")
    .where("user_id", "=", user_id)
    .$if(Boolean(search), (qb) =>
      qb.where("title", "ilike", `%${search!.toLowerCase()}%`),
    )
    .selectAll()
    .select((eb) => [
      eb.fn
        .coalesce(
          eb
            .selectFrom("budget_items")
            .whereRef("budget_items.budget_id", "=", "budgets.id")
            .select(() =>
              sql<number> /*sql*/ `
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
            ),
          sql<number>`0`,
        )
        .as("balance"),
      sql<number>`COUNT(*) OVER ()`.as("total_count"),
    ])
    .orderBy("is_pinned", "desc")
    .orderBy(sortBy, sortByDirection)
    .limit(limit)
    .offset(offset)
    .execute();

  return {
    budgets: budgets.map(({ total_count: _, ...budget }) => budget),
    total_count: budgets[0]?.total_count ?? 0,
    page_size: limit,
    page_number: offset,
  };
};

import { z } from "zod";
import { BUDGET_ITEM_TYPES } from "../db/types";

export const SUPPORTED_SORT_FIELDS = ["balance", "created_at"] as const;

const moneySchema = z
  .number()
  .nonnegative()
  .max(99_999_999.99)
  .multipleOf(0.01);

export const createBudgetSchema = z.object({
  title: z.string().trim().min(1),
  is_pinned: z.boolean().optional(),
});

export const updateBudgetSchema = z
  .object({
    title: z.string().trim().min(1).optional(),
    is_pinned: z.boolean().optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: "At least one field must be provided",
  });

export const createBudgetItemSchema = z.object({
  description: z.string().trim().min(1),
  value: moneySchema,
  type: z.enum(BUDGET_ITEM_TYPES),
});

export const updateBudgetItemSchema = z
  .object({
    description: z.string().trim().min(1).optional(),
    value: moneySchema.optional(),
  })
  .strict()
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: "At least one field must be provided",
  });

export const reorderBudgetItemsSchema = z.object({
  type: z.enum(BUDGET_ITEM_TYPES),
  budget_item_ids: z
    .array(z.uuid("Invalid budget item ID format"))
    .refine((ids) => new Set(ids).size === ids.length, {
      message: "Budget item IDs must be unique",
    }),
});

export const budgetIdParamSchema = z.object({
  id: z.uuid("Invalid budget ID format"),
});

export const budgetItemIdParamSchema = z.object({
  id: z.uuid("Invalid budget ID format"),
  budget_item_id: z.uuid("Invalid budget item ID format"),
});

export const getBudgetsQuerySchema = z.object({
  search: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  offset: z.coerce.number().int().min(0).default(0),
  sort: z
    .string()
    .regex(new RegExp(`^(${SUPPORTED_SORT_FIELDS.join("|")}):(asc|desc)$`))
    .default("created_at:desc"),
});

export type CreateBudgetBody = z.infer<typeof createBudgetSchema>;
export type UpdateBudgetBody = z.infer<typeof updateBudgetSchema>;
export type CreateBudgetItemBody = z.infer<typeof createBudgetItemSchema>;
export type UpdateBudgetItemBody = z.infer<typeof updateBudgetItemSchema>;
export type ReorderBudgetItemsBody = z.infer<typeof reorderBudgetItemsSchema>;
export type GetBudgetsQuery = z.infer<typeof getBudgetsQuerySchema>;

export type BudgetSortField = "balance" | "createdAt";
export type SortDirection = "asc" | "desc";

export type GetBudgetsInput = {
  userId: string;
  search?: string;
  limit: number;
  offset: number;
  sortField: BudgetSortField;
  sortDirection: SortDirection;
};

export type GetBudgetInput = {
  budgetId: string;
  userId: string;
};

export type CreateBudgetInput = {
  title: string;
  isPinned?: boolean;
  userId: string;
};

export type UpdateBudgetInput = {
  budgetId: string;
  title?: string;
  isPinned?: boolean;
  userId: string;
};

export type DeleteBudgetInput = GetBudgetInput;

export type CreateBudgetItemInput = {
  budgetId: string;
  description: string;
  type: (typeof BUDGET_ITEM_TYPES)[number];
  userId: string;
  value: number;
};

export type UpdateBudgetItemInput = {
  budgetId: string;
  budgetItemId: string;
  description?: string;
  userId: string;
  value?: number;
};

export type ReorderBudgetItemsInput = {
  budgetId: string;
  budgetItemIds: string[];
  type: (typeof BUDGET_ITEM_TYPES)[number];
  userId: string;
};

export type DeleteBudgetItemInput = {
  budgetId: string;
  budgetItemId: string;
  userId: string;
};

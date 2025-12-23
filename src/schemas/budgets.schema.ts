import { z } from "zod";
import { BUDGET_ITEMS_TYPES } from "../db/types";

export const SUPPORTED_SORT_FIELDS = ["balance", "created_at"] as const; // supported sortable fields
export type SupportedFields = (typeof SUPPORTED_SORT_FIELDS)[number];

// ZOD SCHEMAS FOR VALIDATION
export const createBudgetSchema = z.object({
  title: z.string().trim(),
  is_pinned: z.boolean().optional(),
});

export const updateBudgetSchema = z
  .object({
    title: z.string().trim().optional(),
    is_pinned: z.boolean().optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: "At least one field must be provided",
  });

export const createBudgetItemSchema = z.object({
  description: z.string().trim(),
  value: z.number().min(0),
  type: z.enum(BUDGET_ITEMS_TYPES),
});

export const updateBudgetItemSchema = z
  .object({
    description: z.string().trim().optional(),
    value: z.number().min(0).optional(),
    type: z.enum(BUDGET_ITEMS_TYPES).optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: "At least one field must be provided",
  });

export const budgetIdParamSchema = z.object({
  id: z.uuid("Invalid budget ID format"),
});

export const budgetItemIdParamSchema = z.object({
  id: z.uuid("Invalid budget ID format"),
  budget_item_id: z.uuid("Invalid budget ID format"),
});

export const getBudgetsQuerySchema = z.object({
  search: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).catch(10),
  offset: z.coerce.number().min(0).catch(0),
  sort: z
    .string()
    .regex(new RegExp(`^(${SUPPORTED_SORT_FIELDS.join("|")}):(asc|desc)$`))
    .catch("created_at:desc"),
});

// SERVICE INPUT TYPES

export type GetBudgetInput = {
  budget_id: string;
  user_id: string;
};

export type CreateBudgetInput = z.infer<typeof createBudgetSchema> & {
  user_id: string;
};

export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema> & {
  user_id: string;
  budget_id: string;
};

export type DeleteBudgetInput = {
  budget_id: string;
  user_id: string;
};

export type CreateBudgetItemInput = z.infer<typeof createBudgetItemSchema> & {
  user_id: string;
  budget_id: string;
};

export type UpdateBudgetItemInput = z.infer<typeof updateBudgetItemSchema> & {
  user_id: string;
  budget_id: string;
  budget_item_id: string;
};

export type DeleteBudgetItemInput = {
  budget_id: string;
  user_id: string;
  budget_item_id: string;
};

export type GetBudgetsQueryInput = z.infer<typeof getBudgetsQuerySchema> & {
  user_id: string;
};

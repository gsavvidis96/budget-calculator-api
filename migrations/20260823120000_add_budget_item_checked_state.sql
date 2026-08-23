-- migrate:up
ALTER TABLE budget_items
ADD COLUMN is_checked BOOLEAN NOT NULL DEFAULT FALSE,
ADD CONSTRAINT budget_items_checked_expenses_only CHECK (
  type = 'EXPENSES'
  OR is_checked = FALSE
);

-- migrate:down
ALTER TABLE budget_items
DROP CONSTRAINT IF EXISTS budget_items_checked_expenses_only,
DROP COLUMN IF EXISTS is_checked;

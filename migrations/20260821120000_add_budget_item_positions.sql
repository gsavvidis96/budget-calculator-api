-- migrate:up
ALTER TABLE budget_items
ADD COLUMN position INTEGER;

ALTER TABLE budget_items DISABLE TRIGGER update_budget_items_updated_at;

WITH
  ranked_items AS (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY
          budget_id,
          type
        ORDER BY
          created_at,
          id
      ) - 1 AS position
    FROM
      budget_items
  )
UPDATE budget_items
SET
  position = ranked_items.position
FROM
  ranked_items
WHERE
  budget_items.id = ranked_items.id;

ALTER TABLE budget_items ENABLE TRIGGER update_budget_items_updated_at;

ALTER TABLE budget_items
ALTER COLUMN position
SET NOT NULL,
ADD CONSTRAINT budget_items_position_nonnegative CHECK (position >= 0),
ADD CONSTRAINT budget_items_budget_type_position_unique UNIQUE (budget_id, type, position)
DEFERRABLE INITIALLY IMMEDIATE;

-- migrate:down
ALTER TABLE budget_items
DROP CONSTRAINT IF EXISTS budget_items_budget_type_position_unique,
DROP CONSTRAINT IF EXISTS budget_items_position_nonnegative,
DROP COLUMN IF EXISTS position;

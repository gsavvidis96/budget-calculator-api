-- migrate:up
CREATE TABLE IF NOT EXISTS budgets (
  id UUID DEFAULT uuid_generate_v4 () PRIMARY KEY,
  title CITEXT NOT NULL,
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (title, user_id)
);

-- Attach the trigger function to the budgets table
CREATE TRIGGER update_budgets_updated_at BEFORE
UPDATE ON budgets FOR EACH ROW
EXECUTE FUNCTION update_updated_at ();

-- migrate:down
DROP TRIGGER IF EXISTS update_budgets_updated_at ON budgets;

DROP TABLE IF EXISTS budgets;

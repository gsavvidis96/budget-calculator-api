-- migrate:up
CREATE INDEX budgets_user_id_idx ON budgets (user_id);

-- migrate:down
DROP INDEX budgets_user_id_idx;

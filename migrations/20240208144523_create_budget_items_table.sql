-- migrate:up
CREATE TABLE IF NOT EXISTS budget_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    type VARCHAR(8) CHECK (type IN ('EXPENSES', 'INCOME')),
    description CITEXT NOT NULL,
    value NUMERIC(10, 2) NOT NULL CHECK (value >= 0),
    budget_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_budget_items_budget_id
      FOREIGN KEY(budget_id) 
        REFERENCES budgets(id) ON DELETE CASCADE,
    CONSTRAINT uc_budget_items_description UNIQUE (budget_id, type, description)
);

-- Attach the trigger function to the budget_items table
CREATE TRIGGER update_budget_items_updated_at
BEFORE UPDATE ON budget_items
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- migrate:down
DROP TRIGGER IF EXISTS update_budget_items_updated_at ON budget_items;
DROP TABLE IF EXISTS budget_items;

-- migrate:up
-- Enable the uuid-ossp extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- case insensitive text
CREATE EXTENSION IF NOT EXISTS citext;  

-- Create the budgets table
CREATE TABLE IF NOT EXISTS budgets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title CITEXT NOT NULL,
    is_pinned BOOLEAN DEFAULT false,
    user_id TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_budgets_user_id
      FOREIGN KEY(user_id) 
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uq_budgets_title_per_user UNIQUE (title, user_id)
);

-- Attach the trigger function to the budgets table
CREATE TRIGGER update_budgets_updated_at
BEFORE UPDATE ON budgets
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- migrate:down
DROP TRIGGER IF EXISTS update_budgets_updated_at ON budgets;
DROP TABLE IF EXISTS budgets;
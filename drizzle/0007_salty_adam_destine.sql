DO $$ BEGIN
 CREATE TYPE "type" AS ENUM('EXPENSES', 'INCOME');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "budget_items" (
	"id" varchar(50) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"description" text NOT NULL,
	"value" numeric NOT NULL,
	"type" "type",
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"budget_id" varchar(50) NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "budget_items" ADD CONSTRAINT "budget_items_budget_id_budgets_id_fk" FOREIGN KEY ("budget_id") REFERENCES "budgets"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

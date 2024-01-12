CREATE TABLE IF NOT EXISTS "budgets" (
	"id" varchar(50) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"title" text NOT NULL,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"user_id" varchar(50) NOT NULL,
	CONSTRAINT "budgets_title_unique" UNIQUE("title")
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "created_at" timestamp DEFAULT now();--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "budgets" ADD CONSTRAINT "budgets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

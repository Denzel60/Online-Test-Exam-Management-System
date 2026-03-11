ALTER TABLE "test_attempts" ADD COLUMN "is_flagged" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "test_attempts" ADD COLUMN "flag_reason" text;--> statement-breakpoint
ALTER TABLE "tests" ADD COLUMN "pass_mark_percent" integer DEFAULT 50;
CREATE TYPE "public"."subscription_status" AS ENUM('TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED');--> statement-breakpoint
CREATE TABLE "psychologist_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"psychologist_id" uuid NOT NULL,
	"plan_id" uuid NOT NULL,
	"status" "subscription_status" DEFAULT 'TRIAL' NOT NULL,
	"trial_ends_at" timestamp with time zone,
	"current_period_start" timestamp with time zone,
	"current_period_end" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"cancel_reason" text,
	"external_customer_id" text,
	"external_subscription_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "psychologist_subscriptions_psychologist_id_unique" UNIQUE("psychologist_id"),
	CONSTRAINT "psychologist_subscriptions_trial_consistency" CHECK ((
        (status = 'TRIAL'  AND trial_ends_at IS NOT NULL) OR
        (status <> 'TRIAL' AND trial_ends_at IS NULL)
      ))
);
--> statement-breakpoint
CREATE TABLE "subscription_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"price_brl" numeric(10, 2),
	"trial_days" integer DEFAULT 0 NOT NULL,
	"max_active_patients" integer,
	"has_listing_highlight" boolean DEFAULT false NOT NULL,
	"has_ai_access" boolean DEFAULT true NOT NULL,
	"support_channels" text[] DEFAULT ARRAY['email']::text[] NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscription_plans_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "psychologist_subscriptions" ADD CONSTRAINT "psychologist_subscriptions_psychologist_id_psychologists_id_fk" FOREIGN KEY ("psychologist_id") REFERENCES "public"."psychologists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "psychologist_subscriptions" ADD CONSTRAINT "psychologist_subscriptions_plan_id_subscription_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plans"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "psychologist_subscriptions_psychologist_uidx" ON "psychologist_subscriptions" USING btree ("psychologist_id");--> statement-breakpoint
CREATE INDEX "psychologist_subscriptions_status_idx" ON "psychologist_subscriptions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "psychologist_subscriptions_external_sub_idx" ON "psychologist_subscriptions" USING btree ("external_subscription_id");--> statement-breakpoint
CREATE INDEX "subscription_plans_active_idx" ON "subscription_plans" USING btree ("is_active","sort_order");
CREATE TYPE "public"."psychologist_social_network" AS ENUM('INSTAGRAM', 'LINKEDIN', 'FACEBOOK', 'X', 'YOUTUBE');--> statement-breakpoint
CREATE TABLE "psychologist_social_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"psychologist_id" uuid NOT NULL,
	"network" "psychologist_social_network" NOT NULL,
	"url" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "psychologist_social_links" ADD CONSTRAINT "psychologist_social_links_psychologist_id_psychologists_id_fk" FOREIGN KEY ("psychologist_id") REFERENCES "public"."psychologists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "psychologist_social_links_psych_network_uidx" ON "psychologist_social_links" USING btree ("psychologist_id","network");
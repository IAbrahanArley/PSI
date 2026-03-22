CREATE TYPE "public"."gender" AS ENUM('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY');--> statement-breakpoint
CREATE TYPE "public"."psychologist_status" AS ENUM('PENDING', 'ACTIVE', 'INACTIVE', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('ADMIN', 'PATIENT', 'PSYCHOLOGIST');--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"full_name" text,
	"avatar_url" text,
	"role" "user_role" DEFAULT 'PATIENT' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_onboarded" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "psychologists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"full_name" text NOT NULL,
	"professional_name" text,
	"crp" text NOT NULL,
	"bio" text,
	"approach" text,
	"gender" "gender",
	"phone" text,
	"whatsapp" text,
	"profile_image_url" text,
	"cover_image_url" text,
	"offers_online" boolean DEFAULT false NOT NULL,
	"offers_presential" boolean DEFAULT false NOT NULL,
	"session_price" numeric(10, 2),
	"session_duration_minutes" integer DEFAULT 50 NOT NULL,
	"languages" text[],
	"state" text,
	"city" text,
	"status" "psychologist_status" DEFAULT 'PENDING' NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "psychologists_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "psychologists_slug_unique" UNIQUE("slug"),
	CONSTRAINT "psychologists_crp_unique" UNIQUE("crp")
);
--> statement-breakpoint
CREATE TABLE "patients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"full_name" text NOT NULL,
	"phone" text,
	"whatsapp" text,
	"birth_date" date,
	"gender" "gender",
	"state" text,
	"city" text,
	"avatar_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "patients_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "psychologists" ADD CONSTRAINT "psychologists_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patients" ADD CONSTRAINT "patients_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "psychologists_slug_idx" ON "psychologists" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "psychologists_crp_idx" ON "psychologists" USING btree ("crp");
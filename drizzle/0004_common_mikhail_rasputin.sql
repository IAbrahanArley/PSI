CREATE TYPE "public"."clinical_note_type" AS ENUM('PROGRESS', 'SESSION', 'ADMINISTRATIVE', 'RISK_OR_SAFETY', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."patient_care_status" AS ENUM('ACTIVE', 'PAUSED', 'DISCHARGED');--> statement-breakpoint
CREATE TABLE "catalog_specialties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"image_url" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "catalog_specialties_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "psychologist_clinical_note_tags" (
	"note_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "psychologist_clinical_note_tags_note_id_tag_id_pk" PRIMARY KEY("note_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "psychologist_clinical_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"psychologist_id" uuid NOT NULL,
	"label" text NOT NULL,
	"color" text,
	"sort_order" smallint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "psychologist_patient_care" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"psychologist_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"status" "patient_care_status" DEFAULT 'ACTIVE' NOT NULL,
	"clinical_summary" text,
	"paused_at" timestamp with time zone,
	"discharged_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "psychologist_patient_clinical_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"psychologist_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"author_user_id" uuid NOT NULL,
	"appointment_id" uuid,
	"title" text,
	"body" text NOT NULL,
	"note_type" "clinical_note_type" DEFAULT 'PROGRESS' NOT NULL,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"pinned_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "psychologists" ADD COLUMN "advertising_highlight" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "psychologist_specialties" ADD COLUMN "catalog_specialty_id" uuid;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "email" text;--> statement-breakpoint
ALTER TABLE "psychologist_clinical_note_tags" ADD CONSTRAINT "psychologist_clinical_note_tags_note_id_psychologist_patient_clinical_notes_id_fk" FOREIGN KEY ("note_id") REFERENCES "public"."psychologist_patient_clinical_notes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "psychologist_clinical_note_tags" ADD CONSTRAINT "psychologist_clinical_note_tags_tag_id_psychologist_clinical_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."psychologist_clinical_tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "psychologist_clinical_tags" ADD CONSTRAINT "psychologist_clinical_tags_psychologist_id_psychologists_id_fk" FOREIGN KEY ("psychologist_id") REFERENCES "public"."psychologists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "psychologist_patient_care" ADD CONSTRAINT "psychologist_patient_care_psychologist_id_psychologists_id_fk" FOREIGN KEY ("psychologist_id") REFERENCES "public"."psychologists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "psychologist_patient_care" ADD CONSTRAINT "psychologist_patient_care_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "psychologist_patient_clinical_notes" ADD CONSTRAINT "psychologist_patient_clinical_notes_psychologist_id_psychologists_id_fk" FOREIGN KEY ("psychologist_id") REFERENCES "public"."psychologists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "psychologist_patient_clinical_notes" ADD CONSTRAINT "psychologist_patient_clinical_notes_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "psychologist_patient_clinical_notes" ADD CONSTRAINT "psychologist_patient_clinical_notes_author_user_id_users_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "psychologist_patient_clinical_notes" ADD CONSTRAINT "psychologist_patient_clinical_notes_appointment_id_psychologist_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."psychologist_appointments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "psych_clinical_note_tags_tag_idx" ON "psychologist_clinical_note_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE UNIQUE INDEX "psychologist_clinical_tags_psych_label_uidx" ON "psychologist_clinical_tags" USING btree ("psychologist_id","label");--> statement-breakpoint
CREATE INDEX "psychologist_clinical_tags_psychologist_idx" ON "psychologist_clinical_tags" USING btree ("psychologist_id");--> statement-breakpoint
CREATE UNIQUE INDEX "psychologist_patient_care_psych_patient_uidx" ON "psychologist_patient_care" USING btree ("psychologist_id","patient_id");--> statement-breakpoint
CREATE INDEX "psychologist_patient_care_psychologist_idx" ON "psychologist_patient_care" USING btree ("psychologist_id");--> statement-breakpoint
CREATE INDEX "psychologist_patient_care_patient_idx" ON "psychologist_patient_care" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "psychologist_patient_care_status_idx" ON "psychologist_patient_care" USING btree ("psychologist_id","status");--> statement-breakpoint
CREATE INDEX "psych_clinical_notes_psych_patient_created_idx" ON "psychologist_patient_clinical_notes" USING btree ("psychologist_id","patient_id","created_at");--> statement-breakpoint
CREATE INDEX "psych_clinical_notes_psych_patient_pinned_idx" ON "psychologist_patient_clinical_notes" USING btree ("psychologist_id","patient_id","is_pinned","pinned_at");--> statement-breakpoint
CREATE INDEX "psych_clinical_notes_appointment_idx" ON "psychologist_patient_clinical_notes" USING btree ("appointment_id");--> statement-breakpoint
CREATE INDEX "psych_clinical_notes_author_idx" ON "psychologist_patient_clinical_notes" USING btree ("author_user_id");--> statement-breakpoint
ALTER TABLE "psychologist_specialties" ADD CONSTRAINT "psychologist_specialties_catalog_specialty_id_catalog_specialties_id_fk" FOREIGN KEY ("catalog_specialty_id") REFERENCES "public"."catalog_specialties"("id") ON DELETE set null ON UPDATE no action;

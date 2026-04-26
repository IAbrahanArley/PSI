CREATE TYPE "public"."agenda_exception_kind" AS ENUM('INACTIVE_DAY', 'INACTIVE_INTERVAL', 'ACTIVE_OVERRIDE_INTERVAL');--> statement-breakpoint
CREATE TYPE "public"."agenda_modality" AS ENUM('ONLINE', 'PRESENTIAL');--> statement-breakpoint
CREATE TYPE "public"."appointment_status" AS ENUM('SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW');--> statement-breakpoint
CREATE TYPE "public"."schedule_block_category" AS ENUM('BREAK', 'ADMIN', 'FOCUS', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."weekly_agenda_rule_type" AS ENUM('AVAILABLE', 'UNAVAILABLE');--> statement-breakpoint
CREATE TABLE "psychologist_agenda_exceptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"psychologist_id" uuid NOT NULL,
	"exception_date" date NOT NULL,
	"kind" "agenda_exception_kind" NOT NULL,
	"start_time" time,
	"end_time" time,
	"address_id" uuid,
	"note" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "psychologist_agenda_exceptions_kind_times" CHECK ((
        (kind = 'INACTIVE_DAY' AND start_time IS NULL AND end_time IS NULL)
        OR
        (kind = 'INACTIVE_INTERVAL' AND start_time IS NOT NULL AND end_time IS NOT NULL AND end_time > start_time)
        OR
        (kind = 'ACTIVE_OVERRIDE_INTERVAL' AND start_time IS NOT NULL AND end_time IS NOT NULL AND end_time > start_time)
      ))
);
--> statement-breakpoint
CREATE TABLE "psychologist_appointment_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"appointment_id" uuid NOT NULL,
	"from_status" "appointment_status",
	"to_status" "appointment_status" NOT NULL,
	"changed_by_user_id" uuid,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "psychologist_appointments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"psychologist_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"modality" "agenda_modality" NOT NULL,
	"address_id" uuid,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"status" "appointment_status" DEFAULT 'SCHEDULED' NOT NULL,
	"title" text,
	"notes" text,
	"cancellation_reason" text,
	"cancelled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "psychologist_appointments_range_order" CHECK (ends_at > starts_at),
	CONSTRAINT "psychologist_appointments_modality_address" CHECK ((
        (modality = 'ONLINE' AND address_id IS NULL) OR
        (modality = 'PRESENTIAL' AND address_id IS NOT NULL)
      ))
);
--> statement-breakpoint
CREATE TABLE "psychologist_schedule_blocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"psychologist_id" uuid NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"modality" "agenda_modality" DEFAULT 'ONLINE' NOT NULL,
	"address_id" uuid,
	"category" "schedule_block_category" DEFAULT 'OTHER' NOT NULL,
	"reason" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "psychologist_schedule_blocks_range_order" CHECK (ends_at > starts_at),
	CONSTRAINT "psychologist_schedule_blocks_modality_address" CHECK ((
        (modality = 'ONLINE' AND address_id IS NULL) OR
        (modality = 'PRESENTIAL' AND address_id IS NOT NULL)
      ))
);
--> statement-breakpoint
CREATE TABLE "psychologist_weekly_availability" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"psychologist_id" uuid NOT NULL,
	"weekday" smallint NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"rule_type" "weekly_agenda_rule_type" DEFAULT 'AVAILABLE' NOT NULL,
	"modality" "agenda_modality" NOT NULL,
	"address_id" uuid,
	"sort_order" smallint DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "psychologist_weekly_availability_weekday_range" CHECK (weekday >= 0 AND weekday <= 6),
	CONSTRAINT "psychologist_weekly_availability_time_order" CHECK (end_time > start_time),
	CONSTRAINT "psychologist_weekly_availability_modality_address" CHECK ((
        (modality = 'ONLINE' AND address_id IS NULL) OR
        (modality = 'PRESENTIAL' AND address_id IS NOT NULL)
      ))
);
--> statement-breakpoint
ALTER TABLE "psychologist_agenda_exceptions" ADD CONSTRAINT "psychologist_agenda_exceptions_psychologist_id_psychologists_id_fk" FOREIGN KEY ("psychologist_id") REFERENCES "public"."psychologists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "psychologist_agenda_exceptions" ADD CONSTRAINT "psychologist_agenda_exceptions_address_id_psychologist_addresses_id_fk" FOREIGN KEY ("address_id") REFERENCES "public"."psychologist_addresses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "psychologist_appointment_status_history" ADD CONSTRAINT "psychologist_appointment_status_history_appointment_id_psychologist_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."psychologist_appointments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "psychologist_appointment_status_history" ADD CONSTRAINT "psychologist_appointment_status_history_changed_by_user_id_users_id_fk" FOREIGN KEY ("changed_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "psychologist_appointments" ADD CONSTRAINT "psychologist_appointments_psychologist_id_psychologists_id_fk" FOREIGN KEY ("psychologist_id") REFERENCES "public"."psychologists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "psychologist_appointments" ADD CONSTRAINT "psychologist_appointments_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "psychologist_appointments" ADD CONSTRAINT "psychologist_appointments_address_id_psychologist_addresses_id_fk" FOREIGN KEY ("address_id") REFERENCES "public"."psychologist_addresses"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "psychologist_schedule_blocks" ADD CONSTRAINT "psychologist_schedule_blocks_psychologist_id_psychologists_id_fk" FOREIGN KEY ("psychologist_id") REFERENCES "public"."psychologists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "psychologist_schedule_blocks" ADD CONSTRAINT "psychologist_schedule_blocks_address_id_psychologist_addresses_id_fk" FOREIGN KEY ("address_id") REFERENCES "public"."psychologist_addresses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "psychologist_weekly_availability" ADD CONSTRAINT "psychologist_weekly_availability_psychologist_id_psychologists_id_fk" FOREIGN KEY ("psychologist_id") REFERENCES "public"."psychologists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "psychologist_weekly_availability" ADD CONSTRAINT "psychologist_weekly_availability_address_id_psychologist_addresses_id_fk" FOREIGN KEY ("address_id") REFERENCES "public"."psychologist_addresses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "psychologist_agenda_exceptions_psychologist_date_idx" ON "psychologist_agenda_exceptions" USING btree ("psychologist_id","exception_date");--> statement-breakpoint
CREATE INDEX "psychologist_agenda_exceptions_psychologist_date_kind_idx" ON "psychologist_agenda_exceptions" USING btree ("psychologist_id","exception_date","kind");--> statement-breakpoint
CREATE INDEX "psychologist_appt_status_hist_appt_created_idx" ON "psychologist_appointment_status_history" USING btree ("appointment_id","created_at");--> statement-breakpoint
CREATE INDEX "psychologist_appointments_psychologist_starts_idx" ON "psychologist_appointments" USING btree ("psychologist_id","starts_at");--> statement-breakpoint
CREATE INDEX "psychologist_appointments_psychologist_status_starts_idx" ON "psychologist_appointments" USING btree ("psychologist_id","status","starts_at");--> statement-breakpoint
CREATE INDEX "psychologist_appointments_patient_starts_idx" ON "psychologist_appointments" USING btree ("patient_id","starts_at");--> statement-breakpoint
CREATE UNIQUE INDEX "psychologist_appointments_psych_active_start_uidx" ON "psychologist_appointments" USING btree ("psychologist_id","starts_at") WHERE status <> 'CANCELLED';--> statement-breakpoint
CREATE INDEX "psychologist_schedule_blocks_psychologist_range_idx" ON "psychologist_schedule_blocks" USING btree ("psychologist_id","starts_at","ends_at");--> statement-breakpoint
CREATE INDEX "psychologist_weekly_availability_psychologist_weekday_idx" ON "psychologist_weekly_availability" USING btree ("psychologist_id","weekday");--> statement-breakpoint
CREATE INDEX "psychologist_weekly_availability_psychologist_modality_idx" ON "psychologist_weekly_availability" USING btree ("psychologist_id","modality");--> statement-breakpoint
CREATE UNIQUE INDEX "psychologist_weekly_availability_unique_slot" ON "psychologist_weekly_availability" USING btree ("psychologist_id","weekday","start_time","end_time","rule_type","modality","address_id");
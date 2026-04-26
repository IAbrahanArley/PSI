CREATE TABLE IF NOT EXISTS "psychologist_addresses" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "psychologist_id" uuid NOT NULL,
  "label" text NOT NULL,
  "street" text,
  "number" text,
  "neighborhood" text,
  "city" text,
  "state" text,
  "zip_code" text,
  "complement" text,
  "reference" text,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "psychologist_addresses" ADD CONSTRAINT "psychologist_addresses_psychologist_id_psychologists_id_fk" FOREIGN KEY ("psychologist_id") REFERENCES "public"."psychologists"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

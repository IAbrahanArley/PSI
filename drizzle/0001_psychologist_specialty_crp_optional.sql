ALTER TABLE "psychologists" ALTER COLUMN "crp" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "psychologists" ADD COLUMN "specialty" text NOT NULL DEFAULT 'Não informado';--> statement-breakpoint
ALTER TABLE "psychologists" ALTER COLUMN "specialty" DROP DEFAULT;
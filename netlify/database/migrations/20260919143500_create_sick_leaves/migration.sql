CREATE TABLE "sick_leaves" (
	"id" text PRIMARY KEY,
	"normalized_service_code" text,
	"patient_id" text,
	"is_companion" boolean DEFAULT false NOT NULL,
	"data" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

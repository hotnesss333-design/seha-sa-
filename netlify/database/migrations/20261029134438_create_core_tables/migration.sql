CREATE TABLE "login_attempts" (
	"id" serial PRIMARY KEY,
	"ip" text NOT NULL,
	"username" text DEFAULT '' NOT NULL,
	"success" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" serial PRIMARY KEY,
	"token_hash" text NOT NULL UNIQUE,
	"token" text NOT NULL,
	"username" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sick_leaves" (
	"id" serial PRIMARY KEY,
	"record_id" text NOT NULL,
	"patient_id" text NOT NULL,
	"service_code" text NOT NULL,
	"patient_name" text DEFAULT '' NOT NULL,
	"hospital" text DEFAULT '' NOT NULL,
	"doctor_name" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'نشطة / سارية' NOT NULL,
	"is_companion" boolean DEFAULT false NOT NULL,
	"from_date" text DEFAULT '' NOT NULL,
	"to_date" text DEFAULT '' NOT NULL,
	"payload" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY,
	"username" text NOT NULL UNIQUE,
	"password_hash" text NOT NULL,
	"name" text DEFAULT 'المسؤول' NOT NULL,
	"role" text DEFAULT 'admin' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "login_attempts_ip_created_idx" ON "login_attempts" ("ip","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "sick_leaves_service_code_idx" ON "sick_leaves" ("service_code");--> statement-breakpoint
CREATE INDEX "sick_leaves_patient_idx" ON "sick_leaves" ("patient_id");
CREATE TABLE "request_limits" (
	"id" text PRIMARY KEY,
	"count" integer NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "health_records" (
	"id" text PRIMARY KEY,
	"owner_id" text NOT NULL,
	"lookup_hash" text NOT NULL UNIQUE,
	"encrypted" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app_sessions" (
	"id" text PRIMARY KEY,
	"user_id" text NOT NULL,
	"csrf_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);

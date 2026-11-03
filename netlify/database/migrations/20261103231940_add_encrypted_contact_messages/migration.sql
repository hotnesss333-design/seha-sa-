CREATE TABLE "contact_messages" (
	"id" text PRIMARY KEY,
	"encrypted" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

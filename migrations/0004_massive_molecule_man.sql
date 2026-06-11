CREATE TYPE "public"."dispute_status" AS ENUM('open', 'under_review', 'resolved', 'dismissed');--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'dispute_opened' BEFORE 'system';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'dispute_updated' BEFORE 'system';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'saved_search_match' BEFORE 'system';--> statement-breakpoint
CREATE TABLE "booking_disputes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"professional_id" uuid NOT NULL,
	"opened_by_id" uuid NOT NULL,
	"status" "dispute_status" DEFAULT 'open' NOT NULL,
	"reason" text NOT NULL,
	"details" text NOT NULL,
	"resolution_note" text,
	"resolved_by_id" uuid,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_searches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"name" text NOT NULL,
	"query" text,
	"category" text,
	"city" text,
	"state" text,
	"max_price_cents" integer,
	"notify_on_new_matches" boolean DEFAULT true NOT NULL,
	"last_viewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "saved_searches_max_price_non_negative_check" CHECK ("saved_searches"."max_price_cents" IS NULL OR "saved_searches"."max_price_cents" >= 0)
);
--> statement-breakpoint
ALTER TABLE "booking_disputes" ADD CONSTRAINT "booking_disputes_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_disputes" ADD CONSTRAINT "booking_disputes_client_id_users_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_disputes" ADD CONSTRAINT "booking_disputes_professional_id_professional_profiles_id_fk" FOREIGN KEY ("professional_id") REFERENCES "public"."professional_profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_disputes" ADD CONSTRAINT "booking_disputes_opened_by_id_users_id_fk" FOREIGN KEY ("opened_by_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_disputes" ADD CONSTRAINT "booking_disputes_resolved_by_id_users_id_fk" FOREIGN KEY ("resolved_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_searches" ADD CONSTRAINT "saved_searches_client_id_users_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "booking_disputes_booking_idx" ON "booking_disputes" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "booking_disputes_status_idx" ON "booking_disputes" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "booking_disputes_participant_idx" ON "booking_disputes" USING btree ("client_id","professional_id");--> statement-breakpoint
CREATE INDEX "saved_searches_client_idx" ON "saved_searches" USING btree ("client_id","updated_at");--> statement-breakpoint
CREATE UNIQUE INDEX "saved_searches_client_name_unique" ON "saved_searches" USING btree ("client_id",lower("name"));
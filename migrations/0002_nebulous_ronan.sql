CREATE TYPE "public"."calendar_connection_status" AS ENUM('not_connected', 'connected', 'paused', 'error');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('not_required', 'deposit_due', 'deposit_recorded', 'paid', 'refunded', 'failed');--> statement-breakpoint
CREATE TYPE "public"."reminder_status" AS ENUM('scheduled', 'sent', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."reschedule_request_status" AS ENUM('pending', 'accepted', 'declined', 'cancelled');--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'booking_reschedule_requested' BEFORE 'message_received';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'booking_reschedule_accepted' BEFORE 'message_received';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'booking_reschedule_declined' BEFORE 'message_received';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'payment_required' BEFORE 'message_received';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'payment_recorded' BEFORE 'message_received';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'reminder_scheduled' BEFORE 'message_received';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'calendar_sync_status' BEFORE 'message_received';--> statement-breakpoint
CREATE TABLE "booking_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"provider" text DEFAULT 'manual' NOT NULL,
	"provider_reference" text,
	"status" "payment_status" DEFAULT 'deposit_due' NOT NULL,
	"amount_cents" integer NOT NULL,
	"currency" text DEFAULT 'usd' NOT NULL,
	"recorded_at" timestamp with time zone,
	"failure_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "booking_payments_amount_non_negative_check" CHECK ("booking_payments"."amount_cents" >= 0)
);
--> statement-breakpoint
CREATE TABLE "booking_policies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"professional_id" uuid NOT NULL,
	"cancellation_window_hours" integer DEFAULT 24 NOT NULL,
	"cancellation_fee_cents" integer DEFAULT 0 NOT NULL,
	"deposit_required" boolean DEFAULT true NOT NULL,
	"reminders_enabled" boolean DEFAULT true NOT NULL,
	"reminder_hours_before" integer DEFAULT 24 NOT NULL,
	"policy_summary" text DEFAULT 'Deposits may be required to hold appointments. Cancellation rules are shown before booking.' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "booking_policies_cancellation_window_non_negative_check" CHECK ("booking_policies"."cancellation_window_hours" >= 0),
	CONSTRAINT "booking_policies_cancellation_fee_non_negative_check" CHECK ("booking_policies"."cancellation_fee_cents" >= 0),
	CONSTRAINT "booking_policies_reminder_hours_positive_check" CHECK ("booking_policies"."reminder_hours_before" > 0)
);
--> statement-breakpoint
CREATE TABLE "booking_reminders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"scheduled_for" timestamp with time zone NOT NULL,
	"type" text DEFAULT 'appointment_reminder' NOT NULL,
	"status" "reminder_status" DEFAULT 'scheduled' NOT NULL,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "booking_reschedule_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"requested_by_id" uuid NOT NULL,
	"proposed_starts_at" timestamp with time zone NOT NULL,
	"proposed_ends_at" timestamp with time zone NOT NULL,
	"status" "reschedule_request_status" DEFAULT 'pending' NOT NULL,
	"note" text,
	"responded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "booking_reschedule_requests_time_order_check" CHECK ("booking_reschedule_requests"."proposed_starts_at" < "booking_reschedule_requests"."proposed_ends_at")
);
--> statement-breakpoint
CREATE TABLE "calendar_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"professional_id" uuid NOT NULL,
	"provider" text DEFAULT 'manual' NOT NULL,
	"external_calendar_id" text,
	"status" "calendar_connection_status" DEFAULT 'not_connected' NOT NULL,
	"sync_direction" text DEFAULT 'export_only' NOT NULL,
	"last_synced_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "payment_status" "payment_status" DEFAULT 'not_required' NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "policy_accepted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "reminder_opt_in" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "cancellation_reason" text;--> statement-breakpoint
ALTER TABLE "booking_payments" ADD CONSTRAINT "booking_payments_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_policies" ADD CONSTRAINT "booking_policies_professional_id_professional_profiles_id_fk" FOREIGN KEY ("professional_id") REFERENCES "public"."professional_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_reminders" ADD CONSTRAINT "booking_reminders_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_reminders" ADD CONSTRAINT "booking_reminders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_reschedule_requests" ADD CONSTRAINT "booking_reschedule_requests_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_reschedule_requests" ADD CONSTRAINT "booking_reschedule_requests_requested_by_id_users_id_fk" FOREIGN KEY ("requested_by_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_connections" ADD CONSTRAINT "calendar_connections_professional_id_professional_profiles_id_fk" FOREIGN KEY ("professional_id") REFERENCES "public"."professional_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "booking_payments_booking_unique" ON "booking_payments" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "booking_payments_status_idx" ON "booking_payments" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "booking_policies_professional_unique" ON "booking_policies" USING btree ("professional_id");--> statement-breakpoint
CREATE UNIQUE INDEX "booking_reminders_booking_user_type_unique" ON "booking_reminders" USING btree ("booking_id","user_id","type");--> statement-breakpoint
CREATE INDEX "booking_reminders_schedule_idx" ON "booking_reminders" USING btree ("status","scheduled_for");--> statement-breakpoint
CREATE INDEX "booking_reschedule_requests_booking_status_idx" ON "booking_reschedule_requests" USING btree ("booking_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "calendar_connections_professional_provider_unique" ON "calendar_connections" USING btree ("professional_id","provider");--> statement-breakpoint
CREATE INDEX "calendar_connections_status_idx" ON "calendar_connections" USING btree ("status");--> statement-breakpoint
CREATE INDEX "bookings_payment_status_idx" ON "bookings" USING btree ("payment_status");
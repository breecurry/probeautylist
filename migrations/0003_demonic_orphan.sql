ALTER TABLE "portfolio_items" ADD COLUMN "before_image_url" text;--> statement-breakpoint
ALTER TABLE "portfolio_items" ADD COLUMN "after_image_url" text;--> statement-breakpoint
ALTER TABLE "portfolio_items" ADD COLUMN "service_tags" text[] DEFAULT ARRAY[]::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "portfolio_items" ADD COLUMN "transformation_notes" text;--> statement-breakpoint
ALTER TABLE "professional_profiles" ADD COLUMN "verified_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "professional_profiles" ADD COLUMN "trust_score" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "professional_profiles" ADD COLUMN "onboarding_step" text DEFAULT 'profile' NOT NULL;--> statement-breakpoint
ALTER TABLE "professional_profiles" ADD COLUMN "profile_completion_percent" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "cleanliness_rating" integer DEFAULT 5 NOT NULL;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "communication_rating" integer DEFAULT 5 NOT NULL;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "value_rating" integer DEFAULT 5 NOT NULL;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "would_recommend" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "photo_urls" text[] DEFAULT ARRAY[]::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "helpful_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_cleanliness_rating_range_check" CHECK ("reviews"."cleanliness_rating" BETWEEN 1 AND 5);--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_communication_rating_range_check" CHECK ("reviews"."communication_rating" BETWEEN 1 AND 5);--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_value_rating_range_check" CHECK ("reviews"."value_rating" BETWEEN 1 AND 5);
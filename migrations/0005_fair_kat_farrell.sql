CREATE TYPE "public"."organization_role" AS ENUM('owner', 'admin', 'member');--> statement-breakpoint
ALTER TYPE "public"."user_role" ADD VALUE 'business' BEFORE 'admin';--> statement-breakpoint
CREATE TABLE "organization_memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"clerk_membership_id" text,
	"role" "organization_role" DEFAULT 'member' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_org_id" text NOT NULL,
	"tenant_id" text NOT NULL,
	"name" text NOT NULL,
	"slug" text,
	"image_url" text,
	"created_by_user_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "professional_profiles" ADD COLUMN "organization_id" uuid;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "clerk_user_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "tenant_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "organization_memberships_org_user_unique" ON "organization_memberships" USING btree ("organization_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "organization_memberships_clerk_membership_id_unique" ON "organization_memberships" USING btree ("clerk_membership_id");--> statement-breakpoint
CREATE INDEX "organization_memberships_user_idx" ON "organization_memberships" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "organizations_clerk_org_id_unique" ON "organizations" USING btree ("clerk_org_id");--> statement-breakpoint
CREATE INDEX "organizations_tenant_id_idx" ON "organizations" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "organizations_slug_idx" ON "organizations" USING btree ("slug");--> statement-breakpoint
ALTER TABLE "professional_profiles" ADD CONSTRAINT "professional_profiles_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "professional_profiles_organization_idx" ON "professional_profiles" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_clerk_user_id_unique" ON "users" USING btree ("clerk_user_id");--> statement-breakpoint
CREATE INDEX "users_tenant_id_idx" ON "users" USING btree ("tenant_id");--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "password_hash";
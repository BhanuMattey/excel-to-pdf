DROP TABLE IF EXISTS "account" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "session" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "user" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "verification" CASCADE;--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS pg_session_jwt;--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated;
  END IF;
END $$;--> statement-breakpoint
GRANT USAGE ON SCHEMA public TO authenticated;--> statement-breakpoint
REVOKE ALL ON TABLE "conversions" FROM public;--> statement-breakpoint
REVOKE ALL ON TABLE "profiles" FROM public;--> statement-breakpoint
REVOKE ALL ON TABLE "payments" FROM public;--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON TABLE "conversions" TO authenticated;--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON TABLE "profiles" TO authenticated;--> statement-breakpoint
GRANT SELECT ON TABLE "payments" TO authenticated;--> statement-breakpoint
DROP POLICY IF EXISTS app_full_access ON "conversions";--> statement-breakpoint
DROP POLICY IF EXISTS app_full_access ON "profiles";--> statement-breakpoint
DROP POLICY IF EXISTS app_full_access ON "payments";

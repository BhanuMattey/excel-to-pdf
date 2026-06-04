ALTER TABLE "conversions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "payments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "conversions_select_own" ON "conversions" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.user_id() = "conversions"."user_id"));--> statement-breakpoint
CREATE POLICY "conversions_insert_own" ON "conversions" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id() = "conversions"."user_id"));--> statement-breakpoint
CREATE POLICY "conversions_update_own" ON "conversions" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id() = "conversions"."user_id")) WITH CHECK ((select auth.user_id() = "conversions"."user_id"));--> statement-breakpoint
CREATE POLICY "payments_select_own" ON "payments" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.user_id() = "payments"."user_id"));--> statement-breakpoint
CREATE POLICY "profiles_select_own" ON "profiles" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.user_id() = "profiles"."id"));--> statement-breakpoint
CREATE POLICY "profiles_insert_own" ON "profiles" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id() = "profiles"."id"));--> statement-breakpoint
CREATE POLICY "profiles_update_own" ON "profiles" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id() = "profiles"."id")) WITH CHECK ((select auth.user_id() = "profiles"."id"));
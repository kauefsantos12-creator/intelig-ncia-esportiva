import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-only Lovable Cloud client for the new sports-intelligence schema.
 *
 * The generated database snapshot still describes the legacy schema while this
 * reset PR is under review. Keep the untyped boundary isolated here instead of
 * spreading schema casts through domain/services. After the migration is live,
 * the generated snapshot can be refreshed without changing the service API.
 */
export async function sportsDb(): Promise<SupabaseClient> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as unknown as SupabaseClient;
}

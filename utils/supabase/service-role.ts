import { createClient } from '@supabase/supabase-js';

/**
 * Server-only Supabase client with the service role key.
 * Use only after verifying the user with the SSR Supabase client (`@/utils/supabase/server`).
 */
export function createServiceRoleSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return null;
  }
  return createClient(url, key);
}

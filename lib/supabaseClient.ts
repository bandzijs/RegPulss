import { createClient } from '@supabase/supabase-js';
import { env } from './env';

/**
 * Supabase Client
 * 
 * Pre-configured Supabase client using validated environment variables.
 * Guaranteed to be initialized with correct credentials.
 */
const supabaseClient = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/**
 * Get Supabase client instance
 * 
 * @returns {SupabaseClient} Initialized Supabase client
 * 
 * @example
 * const client = getSupabaseClient();
 * const { data } = await client.from('table').select();
 */
export const getSupabaseClient = () => {
  return supabaseClient;
};

/**
 * Supabase client instance
 * 
 * Direct export of the initialized Supabase client.
 * 
 * @example
 * import { supabase } from '@/lib/supabaseClient';
 * const { data } = await supabase.from('table').select();
 */
export const supabase = supabaseClient;




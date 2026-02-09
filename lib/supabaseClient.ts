import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Only initialize Supabase client if environment variables are available
// This prevents errors during build time when env vars might not be set
let supabaseClient: ReturnType<typeof createClient> | null = null;

if (supabaseUrl && supabaseAnonKey) {
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
} else if (typeof window !== 'undefined') {
  // Only log warning in browser environment, not during build
  console.warn('Supabase credentials not configured');
}

export const getSupabaseClient = () => {
  if (!supabaseClient) {
    throw new Error('Supabase client not initialized. Check environment variables.');
  }
  return supabaseClient;
};

// For backward compatibility, export a getter function
export const supabase = null;



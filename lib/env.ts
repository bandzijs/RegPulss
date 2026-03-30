/**
 * Environment Variable Validation
 * 
 * Centralized validation of all environment variables using Zod.
 * Ensures required variables are present and properly formatted.
 * Fails fast at build time if validation fails.
 * 
 * @module env
 */

import { z } from 'zod';

/**
 * Environment variable schema
 * 
 * Defines all required and optional environment variables
 * with validation rules.
 */
const envSchema = z.object({
  // Supabase Configuration (Required)
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL')
    .min(1, 'NEXT_PUBLIC_SUPABASE_URL is required'),
  
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),

  // Optional: Site Configuration
  NEXT_PUBLIC_SITE_URL: z
    .string()
    .url()
    .optional()
    .default('https://regpulss.lv'),

  // Optional: Analytics
  NEXT_PUBLIC_VERCEL_ANALYTICS_ID: z
    .string()
    .optional(),

  // Node Environment
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
});

/**
 * Inferred TypeScript type from schema
 */
export type Env = z.infer<typeof envSchema>;

/**
 * Validate environment variables
 * 
 * Parses and validates all environment variables against the schema.
 * Throws detailed error if validation fails.
 * 
 * @throws {Error} If environment variables are invalid or missing
 * @returns {Env} Validated environment variables
 * 
 * @example
 * const env = validateEnv();
 * console.log(env.NEXT_PUBLIC_SUPABASE_URL);
 */
export function validateEnv(): Env {
  try {
    // Construct the object using individual process.env.* accesses so that
    // Next.js / webpack DefinePlugin can inline each NEXT_PUBLIC_* value at
    // build time.  Passing `process.env` as a whole object does NOT work in
    // client bundles because only direct property accesses are replaced.
    return envSchema.parse({
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
      NEXT_PUBLIC_VERCEL_ANALYTICS_ID: process.env.NEXT_PUBLIC_VERCEL_ANALYTICS_ID,
      NODE_ENV: process.env.NODE_ENV,
    });
  } catch (error) {
    console.error('❌ Invalid environment variables:');
    console.error('');
    
    if (error instanceof z.ZodError) {
      const zodError = error as z.ZodError;
      zodError.issues.forEach((err) => {
        console.error(`  • ${err.path.join('.')}: ${err.message}`);
      });
      console.error('');
      console.error('💡 Check your .env.local file and ensure all required variables are set.');
      console.error('📄 See .env.example for reference.');
    }
    
    throw new Error('Environment validation failed');
  }
}

/**
 * Validated environment variables
 * 
 * Pre-validated environment object that can be imported
 * throughout the application. Validation happens at module load time.
 * 
 * @example
 * import { env } from '@/lib/env';
 * 
 * const supabase = createClient(
 *   env.NEXT_PUBLIC_SUPABASE_URL,
 *   env.NEXT_PUBLIC_SUPABASE_ANON_KEY
 * );
 */
export const env = validateEnv();

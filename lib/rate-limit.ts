import { createClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';

const ONE_HOUR_MS = 60 * 60 * 1000;

interface RateLimitRow {
  identifier: string;
  endpoint: string;
  request_count: number;
  window_start: string;
}

export async function rateLimit(
  identifier: string,
  endpoint: string,
  limit: number = 5
): Promise<{ success: boolean; remaining: number; reset: Date }> {
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for rate limiting');
  }

  const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
  );

  const now = new Date();
  const windowStart = new Date(now.getTime() - ONE_HOUR_MS);

  const { data: existing, error: selectError } = await supabase
    .from('rate_limits')
    .select('identifier, endpoint, request_count, window_start')
    .eq('identifier', identifier)
    .eq('endpoint', endpoint)
    .maybeSingle<RateLimitRow>();

  if (selectError) {
    throw new Error(`Rate limit select failed: ${selectError.message}`);
  }

  if (!existing) {
    const { error: insertError } = await supabase.from('rate_limits').insert({
      identifier,
      endpoint,
      request_count: 1,
      window_start: now.toISOString(),
    });

    if (insertError) {
      throw new Error(`Rate limit insert failed: ${insertError.message}`);
    }

    return {
      success: true,
      remaining: limit - 1,
      reset: new Date(now.getTime() + ONE_HOUR_MS),
    };
  }

  const existingWindowStart = new Date(existing.window_start);
  const windowExpired = existingWindowStart < windowStart;

  if (windowExpired) {
    const { error: resetError } = await supabase
      .from('rate_limits')
      .update({
        request_count: 1,
        window_start: now.toISOString(),
      })
      .eq('identifier', identifier)
      .eq('endpoint', endpoint);

    if (resetError) {
      throw new Error(`Rate limit reset failed: ${resetError.message}`);
    }

    return {
      success: true,
      remaining: limit - 1,
      reset: new Date(now.getTime() + ONE_HOUR_MS),
    };
  }

  if (existing.request_count >= limit) {
    return {
      success: false,
      remaining: 0,
      reset: new Date(existingWindowStart.getTime() + ONE_HOUR_MS),
    };
  }

  const nextCount = existing.request_count + 1;
  const { error: updateError } = await supabase
    .from('rate_limits')
    .update({ request_count: nextCount })
    .eq('identifier', identifier)
    .eq('endpoint', endpoint);

  if (updateError) {
    throw new Error(`Rate limit update failed: ${updateError.message}`);
  }

  return {
    success: true,
    remaining: Math.max(limit - nextCount, 0),
    reset: new Date(existingWindowStart.getTime() + ONE_HOUR_MS),
  };
}

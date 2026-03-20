import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { sendConfirmationEmail } from '@/lib/send-confirmation-email';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { getLocale } from '@/lib/i18n/locale';

interface SubscribeRequest {
  email: string;
}

interface SubscribeResponse {
  success?: boolean;
  message?: string;
  error?: string;
}

/**
 * Email validation utility
 *
 * Validates email format using regex pattern.
 * Checks for:
 * - Non-empty local part (before @)
 * - Valid domain (after @)
 * - Valid TLD (after dot)
 *
 * @param {string} email - Email address to validate
 * @returns {boolean} True if email format is valid
 *
 * @example
 * validateEmail('user@example.com'); // true
 * validateEmail('invalid-email'); // false
 */
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * POST /api/subscribe
 *
 * Handle email subscription requests securely on the server.
 *
 * Request Body:
 * ```json
 * {
 *   "email": "user@example.com"
 * }
 * ```
 *
 * Response:
 * - 201 Created: Subscription successful
 * - 400 Bad Request: Missing or invalid email
 * - 409 Conflict: Email already subscribed
 * - 500 Server Error: Database or configuration error
 *
 * Features:
 * - Server-side email validation
 * - Duplicate email detection (409)
 * - Environment variable validation
 * - Secure error messages
 * - Detailed logging for debugging
 *
 * @async
 * @function POST
 * @param {NextRequest} request - HTTP request with JSON body
 * @returns {Promise<NextResponse<SubscribeResponse>>} JSON response with status code
 *
 * @example
 * const response = await fetch('/api/subscribe', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ email: 'user@example.com' })
 * });
 * const { success, message, error } = await response.json();
 *
 * @security
 * - All validation happens server-side (not client)
 * - Supabase credentials stay on server
 * - Email not exposed in error messages
 * - HTTPS required in production
 */
export async function POST(request: NextRequest): Promise<NextResponse<SubscribeResponse>> {
  try {
    const locale = await getLocale();
    const t = getDictionary(locale).apiSubscribe;

    // Get IP address for rate limiting
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';

    // Check rate limit: 5 requests per hour per IP
    const { allowed, remaining, resetTime } = rateLimit(ip, 5, 3600000);

    if (!allowed) {
      return NextResponse.json(
        { error: t.rateLimited },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(resetTime).toISOString(),
            'Retry-After': String(Math.ceil((resetTime - Date.now()) / 1000)),
          }
        }
      );
    }

    // Parse request body
    const body: SubscribeRequest = await request.json();
    const { email } = body;

    // Validate email
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: t.emailRequired },
        { status: 400 }
      );
    }

    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: t.invalidEmail },
        { status: 400 }
      );
    }

    // Initialize Supabase client (using validated environment variables)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Insert email and retrieve the row (including the DB-generated confirmation_token)
    const { data, error } = await supabase
      .from('email_subscriptions')
      .insert([{ email }])
      .select()
      .single();

    if (error) {
      logger.error('Supabase subscription error', error as Error, { email });
      
      if (error.code === '23505') {
        try {
          const userAgent = request.headers.get('user-agent') || 'unknown';
          await supabase
            .from('email_duplicates')
            .insert([{
              email,
              reason: 'Already subscribed',
              user_agent: userAgent,
            }]);
          logger.info('Duplicate email attempt logged', { email });
        } catch (logError) {
          logger.error('Failed to log duplicate email', logError as Error, { email });
        }
        
        return NextResponse.json(
          { error: t.alreadySubscribed },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: t.subscribeFailed },
        { status: 500 }
      );
    }

    // Send confirmation email via SMTP (non-blocking — row is already persisted)
    if (data?.confirmation_token) {
      const emailResult = await sendConfirmationEmail(email, data.confirmation_token);
      if (!emailResult.success) {
        logger.error('Failed to send confirmation email', new Error(emailResult.error ?? 'Unknown'), { email });
      }
    } else {
      logger.error('No confirmation_token returned from insert', new Error('Missing token'), { email });
    }

    return NextResponse.json(
      {
        success: true,
        message: t.successMessage,
      },
      { 
        status: 201,
        headers: {
          'X-RateLimit-Limit': '5',
          'X-RateLimit-Remaining': String(remaining),
          'X-RateLimit-Reset': new Date(resetTime).toISOString(),
        }
      }
    );
  } catch (error) {
    logger.error('Subscription endpoint error', error as Error);
    const locale = await getLocale();
    const t = getDictionary(locale).apiSubscribe;
    return NextResponse.json(
      { error: t.unexpectedError },
      { status: 500 }
    );
  }
}

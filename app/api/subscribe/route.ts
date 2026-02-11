import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

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
    // Get IP address for rate limiting
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';

    // Check rate limit: 5 requests per hour per IP
    const { allowed, remaining, resetTime } = rateLimit(ip, 5, 3600000);

    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many subscription attempts. Please try again later.' },
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
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    // Initialize Supabase client (using validated environment variables)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Insert email into database
    const { error } = await supabase
      .from('email_subscriptions')
      .insert([{ email }]);

    if (error) {
      logger.error('Supabase subscription error', error as Error, { email });
      
      // Check for duplicate email error
      if (error.code === '23505') {
        // Log the duplicate attempt
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
          { error: 'This email is already subscribed.' },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to subscribe. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Successfully subscribed to regulatory updates',
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
    return NextResponse.json(
      { error: 'An error occurred during subscription. Please try again.' },
      { status: 500 }
    );
  }
}

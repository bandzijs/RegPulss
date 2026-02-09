import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

    // Initialize Supabase client with anonymous key (server-side)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Insert email into database
    const { error } = await supabase
      .from('email_subscriptions')
      .insert([{ email }]);

    if (error) {
      console.error('Supabase error:', error);
      
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
        } catch (logError) {
          console.error('Failed to log duplicate:', logError);
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
      { status: 201 }
    );
  } catch (error) {
    console.error('Subscription endpoint error:', error);
    return NextResponse.json(
      { error: 'An error occurred during subscription. Please try again.' },
      { status: 500 }
    );
  }
}

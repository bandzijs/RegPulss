'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

/**
 * SubscribeForm Component
 *
 * Email subscription form with client-side validation and confirmation flow.
 * Inserts the email into `email_subscriptions` via the Supabase client,
 * retrieves the generated `confirmation_token`, and calls the
 * `send-confirmation` Edge Function so the user receives a verification email.
 *
 * @component
 * Features:
 * - Client-side email validation
 * - Direct Supabase insert with `.select().single()` to get confirmation_token
 * - Edge Function call to send confirmation email
 * - Loading state to prevent duplicate submissions
 * - Inline error messages
 * - Success modal with confirmation prompt
 * - Accessible form inputs with aria-labels
 *
 * @example
 * return <SubscribeForm />
 *
 * Accessibility:
 * - Form inputs have aria-label attributes
 * - Success modal can be dismissed by clicking outside or Close button
 * - Error messages are visible inline
 * - Button disabled state during submission
 *
 * @returns {ReactElement} Email subscription form with modal
 */
export default function SubscribeForm() {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Prevent duplicate submissions while a request is in-flight
    if (loading) return;

    const formElement = e.currentTarget;
    const emailInput = formElement.querySelector('input[type="email"]') as HTMLInputElement;
    const email = emailInput.value.trim();

    // Clear previous errors
    setError(null);

    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);

    try {
      // Step 1 – Insert email and retrieve the full row (including confirmation_token)
      const { data, error: insertError } = await supabase
        .from('email_subscriptions')
        .insert({ email })
        .select()
        .single();

      if (insertError) {
        // Duplicate email (unique constraint violation)
        if (insertError.code === '23505') {
          setError('This email is already subscribed.');
          return;
        }
        console.error('Supabase insert error:', insertError);
        setError('Failed to subscribe. Please try again.');
        return;
      }

      // Step 2 – Call the Edge Function to send the confirmation email.
      // Uses supabase.functions.invoke() which automatically attaches the
      // correct Authorization header with the anon key.
      // If this fails we still treat the subscription as successful because
      // the row has been persisted – the user can request a re-send later.
      try {
        const { error: fnError } = await supabase.functions.invoke(
          'send-confirmation',
          { body: { record: data } }
        );

        if (fnError) {
          console.error('Edge Function error:', fnError);
        }
      } catch (edgeFnError) {
        // Log but do NOT block the success flow
        console.error('Edge Function call failed:', edgeFnError);
      }

      // Step 3 – Show success modal and reset form
      setShowModal(true);
      document.body.style.overflow = 'hidden';
      formElement.reset();
    } catch (err) {
      console.error('Subscription error:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    document.body.style.overflow = 'auto';
  };

  return (
    <form
      className="email-form"
      onSubmit={handleSubmit}
    >
      <input
        type="email"
        id="email"
        name="email"
        placeholder="Enter your work email"
        required
        aria-label="Email address"
        className="email-input"
      />
      <button
        type="submit"
        className="cta-button"
        disabled={loading}
      >
        {loading ? 'Subscribing...' : 'Subscribe'}
      </button>

      {/* Error message */}
      {error && (
        <p className="error-message" style={{ color: '#DC2626', marginTop: '0.5rem', fontSize: '0.875rem' }}>
          {error}
        </p>
      )}

      {/* Success Modal */}
      {showModal && (
        <div
          className="modal active"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseModal();
            }
          }}
        >
          <div className="modal-content">
            <div className="modal-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="modal-title">Almost there!</h3>
            <p className="modal-text">
              Please check your email to confirm your subscription.
            </p>
            <button className="modal-button" onClick={handleCloseModal}>
              Close
            </button>
          </div>
        </div>
      )}
    </form>
  );
}

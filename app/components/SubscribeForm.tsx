'use client';

import { useState } from 'react';
import { subscribeEmail } from '@/lib/useSupabase';

export default function SubscribeForm() {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formElement = e.currentTarget;
    const emailInput = formElement.querySelector('input[type="email"]') as HTMLInputElement;
    const email = emailInput.value;

    if (!validateEmail(email)) {
      alert('Please enter a valid email address.');
      return;
    }

    setLoading(true);

    try {
      // Call Supabase to save the email
      const { data, error } = await subscribeEmail(email);

      if (error) {
        alert('Error subscribing. Please try again.');
        console.error('Subscription error:', error.message);
        return;
      }

      // Show success modal
      setShowModal(true);
      document.body.style.overflow = 'hidden';

      // Reset form
      formElement.reset();
    } catch (error) {
      console.error('Subscription error:', error);
      alert('An error occurred. Please try again.');
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
            <h3 className="modal-title">You&apos;re subscribed!</h3>
            <p className="modal-text">
              Thank you for subscribing. You&apos;ll receive regulatory updates directly to your inbox.
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

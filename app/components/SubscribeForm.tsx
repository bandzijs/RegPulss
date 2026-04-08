'use client';

import { useState } from 'react';
import type { Dictionary } from '@/lib/i18n/types';

interface SubscribeFormProps {
  messages: Dictionary['subscribe'];
}

export default function SubscribeForm({ messages }: SubscribeFormProps) {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;

    const formElement = e.currentTarget;
    const emailInput = formElement.querySelector('input[type="email"]') as HTMLInputElement;
    const email = emailInput.value.trim();

    setError(null);

    if (!validateEmail(email)) {
      setError(messages.errorInvalidEmail);
      return;
    }

    setLoading(true);

    try {
      const pageLang = document.documentElement.lang;
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-locale': pageLang || 'en',
        },
        body: JSON.stringify({ email }),
      });

      const body = await res.json();

      if (!res.ok) {
        setError(body.error || messages.errorGeneric);
        return;
      }

      setShowModal(true);
      document.body.style.overflow = 'hidden';
      formElement.reset();
    } catch (err) {
      console.error('Subscription error:', err);
      setError(messages.errorGeneric);
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
        placeholder={messages.emailPlaceholder}
        required
        aria-label={messages.emailAriaLabel}
        className="email-input"
      />
      <button
        type="submit"
        className="cta-button"
        disabled={loading}
      >
        {loading ? messages.subscribing : messages.subscribe}
      </button>

      {error && (
        <p className="error-message" style={{ color: '#DC2626', marginTop: '0.5rem', fontSize: '0.875rem' }}>
          {error}
        </p>
      )}

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
            <h3 className="modal-title">{messages.modalTitle}</h3>
            <p className="modal-text">
              {messages.modalText}
            </p>
            <button type="button" className="modal-button" onClick={handleCloseModal}>
              {messages.close}
            </button>
          </div>
        </div>
      )}
    </form>
  );
}

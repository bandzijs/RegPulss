'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

type ToastType = 'success' | 'error' | null;

export default function ConfirmationToast() {
  const searchParams = useSearchParams();
  const [toastType, setToastType] = useState<ToastType>(null);

  useEffect(() => {
    const confirmed = searchParams.get('confirmed');

    if (confirmed === 'true') {
      setToastType('success');
      window.history.replaceState({}, '', '/');
    } else if (confirmed === 'error') {
      setToastType('error');
      window.history.replaceState({}, '', '/');
    }
  }, [searchParams]);

  useEffect(() => {
    if (!toastType) return;

    const timeout = window.setTimeout(() => {
      setToastType(null);
    }, 5000);

    return () => window.clearTimeout(timeout);
  }, [toastType]);

  if (!toastType) return null;

  const isSuccess = toastType === 'success';
  const message = isSuccess
    ? "✅ Email confirmed! You're now subscribed."
    : '❌ Something went wrong. Please try again.';

  return (
    <>
      <div
        role="status"
        aria-live="polite"
        style={{
          position: 'fixed',
          left: '50%',
          bottom: '24px',
          transform: 'translateX(-50%)',
          backgroundColor: isSuccess ? '#1a1a1a' : '#DC2626',
          color: '#ffffff',
          padding: '12px 16px',
          borderRadius: '10px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          animation: 'fadeIn 240ms ease-out',
        }}
      >
        <span>{message}</span>
        <button
          type="button"
          onClick={() => setToastType(null)}
          aria-label="Close notification"
          style={{
            border: 'none',
            background: 'transparent',
            color: '#ffffff',
            fontSize: '18px',
            lineHeight: 1,
            cursor: 'pointer',
            padding: 0,
          }}
        >
          ×
        </button>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
      `}</style>
    </>
  );
}

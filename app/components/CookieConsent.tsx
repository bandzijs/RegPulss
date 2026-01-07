'use client';

import { useEffect } from 'react';

interface CookieConsentWindow extends Window {
  cookieconsent?: {
    initialise: (options: unknown) => void;
  };
}

export default function CookieConsent() {
  useEffect(() => {
    // Initialize CookieConsent by Osano
    const w = window as CookieConsentWindow;
    if (w.cookieconsent) {
      w.cookieconsent.initialise({
        palette: {
          popup: { background: '#1f2937', text: '#ffffff' },
          button: { background: '#dc2626', text: '#ffffff' },
        },
        content: {
          message: 'We use cookies to enhance your experience and analyze site usage.',
          dismiss: 'Accept',
          link: 'Privacy Policy',
          href: '#',
        },
        theme: 'dark',
        position: 'bottom',
      });
    }
  }, []);

  return null;
}

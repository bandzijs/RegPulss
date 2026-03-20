'use client';

import { useEffect } from 'react';
import type { Dictionary } from '@/lib/i18n/types';

interface CookieConsentWindow extends Window {
  cookieconsent?: {
    initialise: (options: unknown) => void;
  };
}

interface CookieConsentProps {
  content: Dictionary['cookie'];
}

/**
 * CookieConsent Component
 *
 * Initializes the CookieConsent banner by Osano.
 * Handles cookie preferences and policy link.
 *
 * @component
 * - Appears at bottom of page
 * - Themed to match RegPulss branding (dark background, red accent)
 * - Dismissible with Accept button
 * - Link to privacy policy
 *
 * @example
 * return <CookieConsent content={dict.cookie} />
 *
 * Dependencies:
 * - Requires CDN script loaded in layout.tsx:
 *   https://cdn.jsdelivr.net/npm/cookieconsent@3/build/cookieconsent.min.js
 *
 * @returns {null} Component returns null (CDN script handles rendering)
 */
export default function CookieConsent({ content }: CookieConsentProps) {
  useEffect(() => {
    const w = window as CookieConsentWindow;
    if (w.cookieconsent) {
      w.cookieconsent.initialise({
        palette: {
          popup: { background: '#1f2937', text: '#ffffff' },
          button: { background: '#dc2626', text: '#ffffff' },
        },
        content: {
          message: content.message,
          dismiss: content.dismiss,
          link: content.link,
          href: '#',
        },
        theme: 'dark',
        position: 'bottom',
      });
    }
  }, [content.message, content.dismiss, content.link]);

  return null;
}

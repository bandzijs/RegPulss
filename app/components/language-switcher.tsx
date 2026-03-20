'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import type { Locale } from '@/lib/i18n/types';

interface LanguageSwitcherProps {
  locale: Locale;
  labels: {
    switcherAriaLabel: string;
    english: string;
    latvian: string;
  };
}

export default function LanguageSwitcher({
  locale,
  labels,
}: LanguageSwitcherProps) {
  const router = useRouter();
  const [pendingLocale, setPendingLocale] = useState<Locale | null>(null);
  const [isPending, startTransition] = useTransition();

  const switchTo = (next: Locale) => {
    if (next === locale || isPending) return;
    setPendingLocale(next);
    startTransition(async () => {
      try {
        const res = await fetch('/api/locale', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ locale: next }),
        });
        if (!res.ok) {
          setPendingLocale(null);
          return;
        }
        router.refresh();
      } catch {
        // Network error — leave UI unchanged
      } finally {
        setPendingLocale(null);
      }
    });
  };

  const busy = isPending && pendingLocale !== null;

  return (
    <div
      className="language-switcher"
      role="group"
      aria-label={labels.switcherAriaLabel}
    >
      <button
        type="button"
        className={`language-switcher__btn${locale === 'en' ? ' language-switcher__btn--active' : ''}`}
        onClick={() => switchTo('en')}
        disabled={busy}
        aria-pressed={locale === 'en'}
        aria-busy={busy && pendingLocale === 'en'}
      >
        EN
        <span className="sr-only"> ({labels.english})</span>
      </button>
      <button
        type="button"
        className={`language-switcher__btn${locale === 'lv' ? ' language-switcher__btn--active' : ''}`}
        onClick={() => switchTo('lv')}
        disabled={busy}
        aria-pressed={locale === 'lv'}
        aria-busy={busy && pendingLocale === 'lv'}
      >
        LV
        <span className="sr-only"> ({labels.latvian})</span>
      </button>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useState, type ReactNode } from 'react';
import type { Locale } from '@/lib/i18n/types';

const copy = {
  en: {
    confirm: {
      heading: 'Unsubscribe from RegPulss',
      body: 'Are you sure you want to stop receiving weekly regulatory updates?',
      confirm: 'Yes, unsubscribe',
      cancel: 'Keep my subscription',
    },
    success: {
      heading: "You've been unsubscribed",
      body: "You won't receive any more emails from RegPulss. You can resubscribe anytime.",
      button: 'Back to RegPulss',
    },
    error: {
      heading: 'Something went wrong',
      body: 'This unsubscribe link may be invalid or already used.',
      button: 'Back to RegPulss',
    },
  },
  lv: {
    confirm: {
      heading: 'Atrakstīties no RegPulss',
      body: 'Vai tiešām vēlaties pārtraukt saņemt iknedēļas normatīvo aktu atjauninājumus?',
      confirm: 'Jā, atrakstīties',
      cancel: 'Saglabāt abonementu',
    },
    success: {
      heading: 'Jūs esat atrakstījies',
      body: 'Jūs vairs nesaņemsiet e-pastus no RegPulss. Jūs varat atkārtoti abonēt jebkurā laikā.',
      button: 'Atpakaļ uz RegPulss',
    },
    error: {
      heading: 'Kaut kas nogāja greizi',
      body: 'Šī atrakstīšanās saite var būt nederīga vai jau izmantota.',
      button: 'Atpakaļ uz RegPulss',
    },
  },
} as const;

type Phase = 'confirm' | 'success' | 'error';

interface UnsubscribeClientProps {
  token: string;
  locale: Locale;
}

export default function UnsubscribeClient({ token, locale }: UnsubscribeClientProps) {
  const t = copy[locale];
  const [phase, setPhase] = useState<Phase>(() => (!token ? 'error' : 'confirm'));
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    if (!token || loading) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/unsubscribe?token=${encodeURIComponent(token)}`,
        { method: 'GET', redirect: 'manual', cache: 'no-store' }
      );
      const loc = res.headers.get('Location') || '';
      if (res.status >= 300 && res.status < 400 && loc.includes('status=success')) {
        setPhase('success');
        return;
      }
      setPhase('error');
    } catch {
      setPhase('error');
    } finally {
      setLoading(false);
    }
  }

  const shell = (children: ReactNode) => (
    <main
      className="min-h-screen flex items-center justify-center px-6 py-12 bg-white text-[var(--color-text-primary)]"
      lang={locale}
    >
      <div
        className="w-full max-w-[480px] text-center"
        style={{ fontFamily: 'var(--font-inter), Inter, system-ui, sans-serif' }}
      >
        <div className="mb-8">
          <p className="text-lg font-semibold text-[var(--color-text-primary)]">
            <span className="text-[#DC2626]" aria-hidden>
              ⚡
            </span>{' '}
            RegPulss
          </p>
        </div>
        {children}
      </div>
    </main>
  );

  if (phase === 'success') {
    return shell(
      <>
        <div className="mb-6 text-5xl leading-none" aria-hidden>
          ✅
        </div>
        <h1 className="font-[family-name:var(--font-serif)] text-2xl md:text-3xl font-bold text-[var(--color-text-primary)] mb-4">
          {t.success.heading}
        </h1>
        <p className="text-[var(--color-text-secondary)] leading-relaxed mb-8">
          {t.success.body}
        </p>
        <Link href="/" className="cta-button inline-block">
          {t.success.button}
        </Link>
      </>
    );
  }

  if (phase === 'error') {
    return shell(
      <>
        <div className="mb-6 text-5xl leading-none" aria-hidden>
          ❌
        </div>
        <h1 className="font-[family-name:var(--font-serif)] text-2xl md:text-3xl font-bold text-[var(--color-text-primary)] mb-4">
          {t.error.heading}
        </h1>
        <p className="text-[var(--color-text-secondary)] leading-relaxed mb-8">
          {t.error.body}
        </p>
        <Link href="/" className="cta-button inline-block">
          {t.error.button}
        </Link>
      </>
    );
  }

  return shell(
    <>
      <div className="mb-6 text-5xl leading-none" aria-hidden>
        ❓
      </div>
      <h1 className="font-[family-name:var(--font-serif)] text-2xl md:text-3xl font-bold text-[var(--color-text-primary)] mb-4">
        {t.confirm.heading}
      </h1>
      <p className="text-[var(--color-text-secondary)] leading-relaxed mb-8">
        {t.confirm.body}
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
        <button
          type="button"
          className="cta-button disabled:opacity-60"
          onClick={handleConfirm}
          disabled={loading || !token}
        >
          {loading ? '…' : t.confirm.confirm}
        </button>
        <Link
          href="/"
          className="inline-block px-6 py-3 text-sm font-semibold text-[var(--color-text-primary)] border border-[var(--color-border)] rounded-md hover:bg-gray-50 transition-colors"
        >
          {t.confirm.cancel}
        </Link>
      </div>
    </>
  );
}

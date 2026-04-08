import Link from 'next/link';
import type { Locale } from '@/lib/i18n/types';

interface RegPulssStatusShellProps {
  locale: Locale;
  icon: 'success' | 'error' | 'confirm';
  heading: string;
  body: string;
  buttonHref: string;
  buttonLabel: string;
}

export function RegPulssStatusShell({
  locale,
  icon,
  heading,
  body,
  buttonHref,
  buttonLabel,
}: RegPulssStatusShellProps) {
  const iconChar =
    icon === 'success' ? '✅' : icon === 'error' ? '❌' : '❓';

  return (
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

        <div
          className="mb-6 text-5xl leading-none"
          role="img"
          aria-hidden
        >
          {iconChar}
        </div>

        <h1
          className="font-[family-name:var(--font-serif)] text-2xl md:text-3xl font-bold text-[var(--color-text-primary)] mb-4"
        >
          {heading}
        </h1>
        <p className="text-[var(--color-text-secondary)] leading-relaxed mb-8">
          {body}
        </p>

        <Link href={buttonHref} className="cta-button inline-block">
          {buttonLabel}
        </Link>
      </div>
    </main>
  );
}

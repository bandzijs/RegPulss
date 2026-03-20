import { createClient } from '@supabase/supabase-js';
import type { Metadata } from 'next';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { getLocale } from '@/lib/i18n/locale';
import type { Dictionary } from '@/lib/i18n/types';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  return {
    title: dict.confirm.metadataTitle,
  };
}

interface ConfirmPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function ConfirmPage({ searchParams }: ConfirmPageProps) {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const c = dict.confirm;

  const { token } = await searchParams;

  if (!token) {
    return (
      <ConfirmLayout
        status="error"
        message={c.invalidLink}
        dict={c}
      />
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const { data: row, error: selectError } = await supabase
    .from('email_subscriptions')
    .select('id, confirmed')
    .eq('confirmation_token', token)
    .single();

  if (selectError || !row) {
    return (
      <ConfirmLayout
        status="error"
        message={c.invalidOrExpired}
        dict={c}
      />
    );
  }

  if (row.confirmed) {
    return (
      <ConfirmLayout
        status="already"
        message={c.alreadyConfirmed}
        dict={c}
      />
    );
  }

  const { error: updateError } = await supabase
    .from('email_subscriptions')
    .update({ confirmed: true })
    .eq('id', row.id);

  if (updateError) {
    return (
      <ConfirmLayout
        status="error"
        message={c.updateFailed}
        dict={c}
      />
    );
  }

  return (
    <ConfirmLayout
      status="success"
      message={c.successMessage}
      dict={c}
    />
  );
}

function ConfirmLayout({
  status,
  message,
  dict,
}: {
  status: 'success' | 'already' | 'error';
  message: string;
  dict: Dictionary['confirm'];
}) {
  const icon =
    status === 'error' ? (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        width={48}
        height={48}
        style={{ color: '#DC2626' }}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ) : (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        width={48}
        height={48}
        style={{ color: '#16A34A' }}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    );

  const heading =
    status === 'success'
      ? dict.titleSuccess
      : status === 'already'
        ? dict.titleAlready
        : dict.titleError;

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        background: '#f9fafb',
      }}
    >
      <section
        style={{
          maxWidth: '480px',
          width: '100%',
          textAlign: 'center',
          background: '#ffffff',
          borderRadius: '12px',
          padding: '3rem 2rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ marginBottom: '1.5rem' }}>{icon}</div>
        <h1
          style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            color: '#111827',
            marginBottom: '0.75rem',
          }}
        >
          {heading}
        </h1>
        <p style={{ color: '#4b5563', lineHeight: 1.6 }}>{message}</p>
        <a
          href="/"
          style={{
            display: 'inline-block',
            marginTop: '2rem',
            padding: '0.75rem 2rem',
            background: '#2563eb',
            color: '#ffffff',
            borderRadius: '6px',
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          {dict.backHome}
        </a>
      </section>
    </main>
  );
}

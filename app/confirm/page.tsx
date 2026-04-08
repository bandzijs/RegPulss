import { createClient } from '@supabase/supabase-js';
import type { Metadata } from 'next';
import { RegPulssStatusShell } from '@/app/components/regpulss-status-shell';
import { getLocale } from '@/lib/i18n/locale';
import type { Locale } from '@/lib/i18n/types';

const pageCopy = {
  en: {
    success: {
      heading: 'Email confirmed!',
      body: "You're now subscribed to RegPulss weekly regulatory updates.",
      button: 'Go to RegPulss',
    },
    error: {
      heading: 'Invalid confirmation link',
      body: 'This link may be expired or already used.',
      button: 'Back to RegPulss',
    },
  },
  lv: {
    success: {
      heading: 'E-pasts apstiprināts!',
      body: 'Jūs tagad esat abonējis RegPulss iknedēļas normatīvo aktu atjauninājumus.',
      button: 'Doties uz RegPulss',
    },
    error: {
      heading: 'Nederīga apstiprinājuma saite',
      body: 'Šī saite var būt beigusies vai jau izmantota.',
      button: 'Atpakaļ uz RegPulss',
    },
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const title =
    locale === 'lv' ? 'Apstiprināt e-pastu' : 'Confirm email';
  return { title };
}

interface ConfirmPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function ConfirmPage({ searchParams }: ConfirmPageProps) {
  const locale: Locale = await getLocale();
  const t = pageCopy[locale];
  const { token } = await searchParams;

  if (!token) {
    return (
      <RegPulssStatusShell
        locale={locale}
        icon="error"
        heading={t.error.heading}
        body={t.error.body}
        buttonHref="/"
        buttonLabel={t.error.button}
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
      <RegPulssStatusShell
        locale={locale}
        icon="error"
        heading={t.error.heading}
        body={t.error.body}
        buttonHref="/"
        buttonLabel={t.error.button}
      />
    );
  }

  if (row.confirmed) {
    return (
      <RegPulssStatusShell
        locale={locale}
        icon="success"
        heading={t.success.heading}
        body={t.success.body}
        buttonHref="/"
        buttonLabel={t.success.button}
      />
    );
  }

  const { error: updateError } = await supabase
    .from('email_subscriptions')
    .update({ confirmed: true })
    .eq('id', row.id);

  if (updateError) {
    return (
      <RegPulssStatusShell
        locale={locale}
        icon="error"
        heading={t.error.heading}
        body={t.error.body}
        buttonHref="/"
        buttonLabel={t.error.button}
      />
    );
  }

  return (
    <RegPulssStatusShell
      locale={locale}
      icon="success"
      heading={t.success.heading}
      body={t.success.body}
      buttonHref="/"
      buttonLabel={t.success.button}
    />
  );
}

import type { Metadata } from 'next';
import { getLocale } from '@/lib/i18n/locale';
import type { Locale } from '@/lib/i18n/types';
import UnsubscribeClient from './unsubscribe-client';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const title =
    locale === 'lv' ? 'Atrakstīties no RegPulss' : 'Unsubscribe from RegPulss';
  return { title };
}

interface UnsubscribePageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function UnsubscribePage({ searchParams }: UnsubscribePageProps) {
  const locale: Locale = await getLocale();
  const { token } = await searchParams;

  return <UnsubscribeClient token={token?.trim() ?? ''} locale={locale} />;
}

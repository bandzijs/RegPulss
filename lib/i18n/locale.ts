import { cookies } from 'next/headers';
import type { Locale } from './types';

export const LOCALE_COOKIE_NAME = 'regpulss_locale';

const VALID_LOCALES: Locale[] = ['en', 'lv'];

function parseLocale(value: string | undefined): Locale {
  if (value === 'lv' || value === 'en') {
    return value;
  }
  return 'en';
}

/**
 * Reads locale from the regpulss_locale cookie (set via POST /api/locale).
 * Defaults to English when missing or invalid.
 */
export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(LOCALE_COOKIE_NAME)?.value;
  return parseLocale(raw);
}

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && VALID_LOCALES.includes(value as Locale);
}

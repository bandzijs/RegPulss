import { NextRequest, NextResponse } from 'next/server';
import { isLocale, LOCALE_COOKIE_NAME } from '@/lib/i18n/locale';

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/**
 * POST /api/locale — set preferred UI language (en | lv).
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as { locale?: unknown };
    const locale = body.locale;

    if (!isLocale(locale)) {
      return NextResponse.json(
        { error: 'Invalid locale. Use "en" or "lv".' },
        { status: 400 },
      );
    }

    const response = NextResponse.json({ success: true, locale });
    response.cookies.set(LOCALE_COOKIE_NAME, locale, {
      path: '/',
      maxAge: ONE_YEAR_SECONDS,
      sameSite: 'lax',
      httpOnly: true,
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body.' },
      { status: 400 },
    );
  }
}

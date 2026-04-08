import { NextResponse } from 'next/server';
import React from 'react';
import { render } from '@react-email/render';
import { Resend } from 'resend';
import { Confirmation } from '@/emails/confirmation';
import { env } from '@/lib/env';
import { isLocale } from '@/lib/i18n/locale';
import type { Locale } from '@/lib/i18n/types';

interface ConfirmationPayload {
  email?: string;
  confirmationToken?: string;
  locale?: Locale;
}

export async function POST(request: Request) {
  const confirmationSecret = process.env.CONFIRMATION_SECRET;
  const providedSecret = request.headers.get('x-confirmation-secret');

  if (!confirmationSecret || providedSecret !== confirmationSecret) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    return NextResponse.json(
      { success: false, error: 'Missing RESEND_API_KEY' },
      { status: 500 }
    );
  }

  let payload: ConfirmationPayload;
  try {
    payload = (await request.json()) as ConfirmationPayload;
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid request body' },
      { status: 400 }
    );
  }

  const email = payload.email?.trim();
  const confirmationToken = payload.confirmationToken?.trim();
  const locale: Locale = isLocale(payload.locale) ? payload.locale : 'en';

  if (!email || !confirmationToken) {
    return NextResponse.json(
      { success: false, error: 'Missing email or confirmationToken' },
      { status: 400 }
    );
  }

  const confirmationUrl = `${env.NEXT_PUBLIC_SITE_URL}/confirm?token=${confirmationToken}`;
  const html = await render(
    React.createElement(Confirmation, {
      email,
      confirmationUrl,
      locale,
    })
  );

  const resend = new Resend(resendApiKey);
  const { error } = await resend.emails.send({
    from: 'RegPulss <newsletter@regpulss.lv>',
    to: email,
    subject: locale === 'lv' ? 'Apstipriniet savu abonementu' : 'Confirm your subscription',
    html,
  });

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}

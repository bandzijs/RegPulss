import { NextResponse } from 'next/server';
import { render } from '@react-email/render';
import { Resend } from 'resend';
import { createClient } from '@/utils/supabase/server';
import { Newsletter } from '@/emails/newsletter';
import React from 'react';

interface NewsletterRequestBody {
  subject: string;
  body?: string;
  html?: string;
}

function chunkEmails(emails: string[], size: number): string[][] {
  const chunks: string[][] = [];
  for (let index = 0; index < emails.length; index += size) {
    chunks.push(emails.slice(index, index + size));
  }
  return chunks;
}

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const allowedEmails = process.env.ADMIN_EMAILS?.split(',') ?? [];
  if (!allowedEmails.includes(user.email ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    return NextResponse.json(
      { success: false, error: 'Missing RESEND_API_KEY' },
      { status: 500 }
    );
  }

  let payload: NewsletterRequestBody;
  try {
    payload = (await request.json()) as NewsletterRequestBody;
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid request body' },
      { status: 400 }
    );
  }

  const subject = payload.subject?.trim();
  const body = payload.body?.trim();
  const htmlFromRequest = payload.html?.trim();

  if (!subject || (!body && !htmlFromRequest)) {
    return NextResponse.json(
      { success: false, error: 'Subject and email content are required' },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from('email_subscriptions')
    .select('email')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch subscribers for newsletter:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load subscribers' },
      { status: 500 }
    );
  }

  const emails = (data ?? [])
    .map((entry) => entry.email)
    .filter((value): value is string => Boolean(value));

  if (emails.length === 0) {
    return NextResponse.json({
      success: true,
      message: 'No subscribers found. Nothing was sent.',
      sentCount: 0,
    });
  }

  const resend = new Resend(resendApiKey);
  const emailChunks = chunkEmails(emails, 50);
  const html = htmlFromRequest
    ? htmlFromRequest
    : await render(React.createElement(Newsletter, { subject, body: body ?? '' }));

  try {
    for (const to of emailChunks) {
      await resend.emails.send({
        from: 'noreply@regpulss.lv',
        to,
        subject,
        html,
      });
    }
  } catch (sendError) {
    console.error('Failed to send newsletter:', sendError);
    return NextResponse.json(
      { success: false, error: 'Failed while sending emails' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: `Newsletter sent to ${emails.length} subscribers.`,
    sentCount: emails.length,
  });
}

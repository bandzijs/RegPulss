import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@/utils/supabase/server';

interface NewsletterRequestBody {
  subject: string;
  body: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildNewsletterHtml(subject: string, body: string): string {
  const safeSubject = escapeHtml(subject);
  const safeBody = escapeHtml(body).replace(/\n/g, '<br />');

  return `
    <div style="margin:0;padding:0;background:#ffffff;font-family:Inter,Arial,sans-serif;color:#1a1a1a;">
      <div style="max-width:600px;margin:0 auto;padding:32px 20px;">
        <p style="margin:0 0 8px 0;font-size:12px;color:#666666;letter-spacing:0.08em;text-transform:uppercase;">
          RegPulss
        </p>
        <h1 style="margin:0 0 18px 0;font-size:30px;line-height:1.2;font-family:Georgia,'Times New Roman',serif;color:#1a1a1a;">
          ${safeSubject}
        </h1>
        <div style="font-size:16px;line-height:1.7;color:#1a1a1a;">
          ${safeBody}
        </div>
      </div>
    </div>
  `;
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

  if (!subject || !body) {
    return NextResponse.json(
      { success: false, error: 'Subject and body are required' },
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
  const html = buildNewsletterHtml(subject, body);

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

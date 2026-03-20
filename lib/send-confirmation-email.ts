import nodemailer from 'nodemailer';

interface SendConfirmationResult {
  success: boolean;
  error?: string;
}

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT || '465');
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM;
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://reg-pulss.vercel.app';

export async function sendConfirmationEmail(
  email: string,
  confirmationToken: string
): Promise<SendConfirmationResult> {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !SMTP_FROM) {
    return { success: false, error: 'SMTP environment variables are not configured' };
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  const confirmUrl = `${SITE_URL}/confirm?token=${confirmationToken}`;

  try {
    await transporter.sendMail({
      from: SMTP_FROM,
      to: email,
      subject: 'Confirm your RegPulss subscription',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px;">
          <h2 style="color: #111827; margin-bottom: 16px;">Welcome to RegPulss!</h2>
          <p style="color: #374151; line-height: 1.6;">
            Thank you for subscribing to regulatory updates. Please confirm your
            email address by clicking the button below.
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a
              href="${confirmUrl}"
              style="
                display: inline-block;
                background-color: #2563eb;
                color: #ffffff;
                padding: 12px 32px;
                border-radius: 6px;
                text-decoration: none;
                font-weight: 600;
              "
            >
              Confirm Subscription
            </a>
          </div>
          <p style="color: #6b7280; font-size: 14px; line-height: 1.5;">
            If the button doesn&rsquo;t work, copy and paste this link into your
            browser:<br />
            <a href="${confirmUrl}" style="color: #2563eb;">${confirmUrl}</a>
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="color: #9ca3af; font-size: 12px;">
            If you did not subscribe to RegPulss, you can safely ignore this email.
          </p>
        </div>
      `,
    });

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: message };
  }
}

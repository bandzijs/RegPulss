import "@supabase/functions-js/edge-runtime.d.ts";

type RequestPayload = {
  email?: string;
  confirmationToken?: string;
  record?: {
    email?: string;
    confirmation_token?: string;
    unsubscribe_token?: string;
  };
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SITE_URL = Deno.env.get("SITE_URL") ?? "https://reg-pulss.vercel.app";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildConfirmationEmailHtml(confirmUrl: string, unsubscribeUrl: string): string {
  const safeConfirm = escapeHtml(confirmUrl);
  const safeUnsub = escapeHtml(unsubscribeUrl);
  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Confirm your subscription</title>
  </head>
  <body style="margin:0;padding:0;background-color:#0b0b0b;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#0b0b0b;padding:40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background-color:#111827;border-radius:12px;border:1px solid rgba(255,255,255,0.06);overflow:hidden;">
            <tr>
              <td style="background-color:#1a1a1a;padding:16px 24px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.08);">
                <span style="font-size:13px;font-weight:700;letter-spacing:0.12em;color:#9ca3af;">REGPULSS</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 28px 28px 28px;">
                <h1 style="margin:0 0 16px 0;font-size:22px;font-weight:700;color:#ffffff;text-align:center;line-height:1.3;">
                  Confirm your subscription
                </h1>
                <p style="margin:0 0 28px 0;font-size:14px;line-height:1.65;color:#d1d5db;text-align:center;">
                  Thank you for subscribing. Please confirm your email address by clicking the button below.
                </p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td align="center" style="padding-bottom:28px;">
                      <a href="${safeConfirm}" style="display:inline-block;background-color:#1a1a1a;color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;border:1px solid rgba(255,255,255,0.12);">
                        Confirm Subscription
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="margin:0 0 20px 0;font-size:13px;line-height:1.5;color:#6b7280;text-align:center;">
                  If the button does not work, copy and paste this link into your browser:<br />
                  <a href="${safeConfirm}" style="color:#93c5fd;word-break:break-all;">${safeConfirm}</a>
                </p>
                <hr style="border:none;border-top:1px solid rgba(229,231,235,0.14);margin:24px 0;" />
                <p style="margin:0;font-size:12px;line-height:1.6;color:#9ca3af;text-align:center;">
                  Don&rsquo;t want these emails?
                  <a href="${safeUnsub}" style="color:#9ca3af;text-decoration:underline;">Unsubscribe</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`.trim();
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json" } },
    );
  }

  if (!RESEND_API_KEY) {
    return new Response(
      JSON.stringify({ error: "RESEND_API_KEY is not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  let payload: RequestPayload;

  try {
    payload = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const email = (payload.record?.email ?? payload.email)?.trim();
  const confirmationToken = (payload.record?.confirmation_token ?? payload.confirmationToken)?.trim();

  if (!email || !confirmationToken) {
    return new Response(
      JSON.stringify({ error: "Missing email or confirmationToken" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const record = payload.record ?? {};

  const confirmUrl = `${SITE_URL}/confirm?token=${confirmationToken}`;
  const unsubscribeUrl = `${SITE_URL}/api/unsubscribe?token=${record.unsubscribe_token ?? confirmationToken}`;

  const html = buildConfirmationEmailHtml(confirmUrl, unsubscribeUrl);

  const resendResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "RegPulss <newsletter@regpulss.lv>",
      to: email,
      subject: "Confirm your RegPulss subscription",
      html,
    }),
  });

  const resendData = await resendResponse.json();

  if (!resendResponse.ok) {
    return new Response(
      JSON.stringify({
        error: "Failed to send confirmation email",
        details: resendData,
      }),
      { status: 502, headers: { "Content-Type": "application/json" } },
    );
  }

  return new Response(
    JSON.stringify({ success: true, id: resendData.id }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
});

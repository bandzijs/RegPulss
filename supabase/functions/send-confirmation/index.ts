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
  const sans =
    "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, Helvetica, sans-serif";
  const serif = "Georgia, 'Times New Roman', Times, serif";
  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Confirm your subscription</title>
  </head>
  <body style="margin:0;padding:0;background-color:#ffffff;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#ffffff;">
      <tr>
        <td align="center" style="padding:48px 24px 0 24px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;">
            <tr>
              <td style="background-color:#ffffff;padding:0 0 40px 0;text-align:center;">
                <span style="font-family:${sans};font-size:18px;font-weight:600;color:#DC2626;">&#9889;</span>
                <span style="font-family:${sans};font-size:18px;font-weight:600;color:#1a1a1a;"> RegPulss</span>
              </td>
            </tr>
            <tr>
              <td style="background-color:#ffffff;padding:0 8px 56px 8px;">
                <h1 style="margin:0 0 32px 0;font-family:${serif};font-size:28px;font-weight:700;color:#1a1a1a;text-align:center;line-height:1.25;">
                  Confirm your subscription
                </h1>
                <p style="margin:0 auto 40px auto;font-family:${sans};font-size:15px;line-height:1.7;color:#1a1a1a;text-align:center;max-width:440px;">
                  Thank you for subscribing. Please confirm your email address by clicking the button below.
                </p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td align="center" style="padding-bottom:48px;">
                      <a href="${safeConfirm}" style="display:inline-block;background-color:#1a1a1a;color:#ffffff;padding:16px 40px;border-radius:0;text-decoration:none;font-family:${sans};font-weight:600;font-size:14px;letter-spacing:0.02em;">
                        Confirm Subscription
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="margin:0;font-family:${sans};font-size:13px;line-height:1.6;color:#666666;text-align:center;">
                  If the button does not work, copy and paste this link into your browser:<br />
                  <a href="${safeConfirm}" style="color:#DC2626;text-decoration:underline;word-break:break-all;">${safeConfirm}</a>
                </p>
              </td>
            </tr>
            <tr>
              <td style="background-color:#f5f5f5;padding:28px 32px;text-align:center;">
                <p style="margin:0;font-family:${sans};font-size:12px;line-height:1.65;color:#737373;">
                  Don&rsquo;t want these emails?
                  <a href="${safeUnsub}" style="color:#737373;text-decoration:underline;">Unsubscribe</a>
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

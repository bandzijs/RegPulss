import "@supabase/functions-js/edge-runtime.d.ts";

type RequestPayload = {
  email?: string;
  confirmationToken?: string;
  locale?: "en" | "lv";
  record?: {
    email?: string;
    confirmation_token?: string;
    unsubscribe_token?: string;
  };
};

const SITE_URL = Deno.env.get("SITE_URL") ?? "https://reg-pulss.vercel.app";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const translations = {
  en: {
    subject: "Confirm your subscription",
    title: "Confirm your subscription",
    body: "Thank you for subscribing. Please confirm your email address by clicking the button below.",
    button: "Confirm Subscription",
    fallback: "If the button does not work, copy and paste this link into your browser:",
    unsubscribe: "Don't want these emails?",
    unsubscribeLink: "Unsubscribe",
  },
  lv: {
    subject: "Apstipriniet savu abonementu",
    title: "Apstipriniet savu abonementu",
    body: "Paldies, ka abonējāt. Lūdzu, apstipriniet savu e-pasta adresi, noklikšķinot uz pogas zemāk.",
    button: "Apstiprināt abonementu",
    fallback: "Ja poga nedarbojas, kopējiet un ielīmējiet šo saiti savā pārlūkprogrammā:",
    unsubscribe: "Nevēlaties šos e-pastus?",
    unsubscribeLink: "Atrakstīties",
  },
} as const;

function buildConfirmationHtml(
  email: string,
  confirmationUrl: string,
  unsubscribeUrl: string,
  locale: "en" | "lv",
): string {
  const t = translations[locale];

  return `<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${t.subject}</title>
  </head>
  <body style="background-color:#ffffff;margin:0;padding:0;">
    <div style="max-width:560px;margin:0 auto;padding:48px 24px 0 24px;background-color:#ffffff;">
      <div style="text-align:center;padding:0 0 40px 0;">
        <p style="margin:0;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,Helvetica,sans-serif;font-size:18px;font-weight:600;line-height:1.4;">
          <span style="color:#DC2626;">⚡</span><span style="color:#1a1a1a;"> RegPulss</span>
        </p>
      </div>
      <div style="padding:0 8px 56px 8px;">
        <p style="margin:0 0 32px 0;font-family:Georgia,'Times New Roman',Times,serif;font-size:28px;font-weight:700;color:#1a1a1a;text-align:center;line-height:1.25;">
          ${t.title}
        </p>
        <p style="margin:0 0 18px 0;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,Helvetica,sans-serif;font-size:15px;line-height:1.7;color:#1a1a1a;text-align:center;max-width:440px;margin-left:auto;margin-right:auto;">
          ${t.body}
        </p>
        <p style="margin:0 0 28px 0;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#666666;text-align:center;">
          ${email}
        </p>
        <div style="text-align:center;padding-bottom:48px;">
          <a href="${confirmationUrl}" style="display:inline-block;background-color:#1a1a1a;color:#ffffff;padding:16px 40px;border-radius:0;text-decoration:none;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,Helvetica,sans-serif;font-weight:600;font-size:14px;letter-spacing:0.02em;">
            ${t.button}
          </a>
        </div>
        <p style="margin:0;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;color:#666666;text-align:center;">
          ${t.fallback}<br />
          <a href="${confirmationUrl}" style="color:#DC2626;text-decoration:underline;">${confirmationUrl}</a>
        </p>
        <p style="margin:16px 0 0 0;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#666666;text-align:center;">
          ${t.unsubscribe} <a href="${unsubscribeUrl}" style="color:#DC2626;text-decoration:underline;">${t.unsubscribeLink}</a>
        </p>
      </div>
    </div>
  </body>
</html>`;
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
    const rawBody = await req.text();
    console.log("raw body received:", rawBody);
    payload = JSON.parse(rawBody) as RequestPayload;
    console.log("parsed locale:", payload.locale);
    console.log("parsed record:", payload.record);
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const email = (payload.record?.email ?? payload.email)?.trim();
  const confirmationToken = (payload.record?.confirmation_token ?? payload.confirmationToken)?.trim();
  const unsubscribeToken = payload.record?.unsubscribe_token?.trim();
  const locale = payload.locale === "lv" ? "lv" : "en";

  if (!email || !confirmationToken) {
    return new Response(
      JSON.stringify({ error: "Missing email or confirmationToken" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const confirmationUrl = `${SITE_URL}/confirm?token=${encodeURIComponent(confirmationToken)}`;
  const unsubscribeUrl = unsubscribeToken
    ? `${SITE_URL}/api/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`
    : confirmationUrl;
  const html = buildConfirmationHtml(email, confirmationUrl, unsubscribeUrl, locale);
  const subject = translations[locale].subject;

  const resendResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "RegPulss <newsletter@regpulss.lv>",
      to: [email],
      subject,
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
    JSON.stringify({ success: true, data: resendData, locale }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
});

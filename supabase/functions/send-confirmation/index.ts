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
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            Don't want these emails?
            <a
              href="${SITE_URL}/api/unsubscribe?token=${record.unsubscribe_token ?? confirmationToken}"
              style="color: #6b7280;"
            >
              Unsubscribe
            </a>
          </p>
        </div>
      `,
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

import "@supabase/functions-js/edge-runtime.d.ts";
import { render as renderAsync } from "npm:@react-email/render@2.0.4";
import { ConfirmationEmail } from "../../../emails/confirmation.tsx";

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

  const html = await renderAsync(
    ConfirmationEmail({
      confirmUrl: confirmUrl,
      unsubscribeUrl: `${SITE_URL}/api/unsubscribe?token=${record.unsubscribe_token ?? confirmationToken}`,
    }),
  );

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

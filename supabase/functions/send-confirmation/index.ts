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
const CONFIRMATION_SECRET = Deno.env.get("CONFIRMATION_SECRET");

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json" } },
    );
  }

  if (!CONFIRMATION_SECRET) {
    return new Response(
      JSON.stringify({ error: "CONFIRMATION_SECRET is not configured" }),
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
  const locale = payload.locale === "lv" ? "lv" : "en";

  if (!email || !confirmationToken) {
    return new Response(
      JSON.stringify({ error: "Missing email or confirmationToken" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const apiResponse = await fetch(`${SITE_URL}/api/send-confirmation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-confirmation-secret": CONFIRMATION_SECRET,
    },
    body: JSON.stringify({
      email,
      confirmationToken,
      locale,
    }),
  });

  const apiData = await apiResponse.json();

  if (!apiResponse.ok) {
    return new Response(
      JSON.stringify({
        error: "Failed to send confirmation email",
        details: apiData,
      }),
      { status: 502, headers: { "Content-Type": "application/json" } },
    );
  }

  return new Response(
    JSON.stringify({ success: true, data: apiData }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
});

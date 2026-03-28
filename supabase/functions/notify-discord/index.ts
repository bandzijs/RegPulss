import "@supabase/functions-js/edge-runtime.d.ts";

type WebhookPayload = {
  record?: {
    email?: string;
    created_at?: string;
  };
};

function formatRegisteredAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return iso;
  }
  const formatted = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Europe/Riga",
  }).format(d);
  return formatted.replace(", ", " at ");
}

Deno.serve(async (req) => {
  const webhookUrl = Deno.env.get("DISCORD_WEBHOOK_URL");

  if (!webhookUrl) {
    return new Response(
      JSON.stringify({ error: "DISCORD_WEBHOOK_URL is not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  let payload: WebhookPayload;

  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const email = payload.record?.email?.trim();
  const createdAt = payload.record?.created_at?.trim();

  if (!email || !createdAt) {
    return new Response(
      JSON.stringify({ error: "Missing record.email or record.created_at" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  const registered = formatRegisteredAt(createdAt);
  const content =
    `🆕 New Subscriber!\n📧 Email: ${email}\n🕐 Registered: ${registered}`;

  try {
    const discordRes = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });

    if (!discordRes.ok) {
      const errText = await discordRes.text();
      console.error("Discord webhook failed:", discordRes.status, errText);
      return new Response(
        JSON.stringify({
          error: "Discord request failed",
          status: discordRes.status,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("notify-discord error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/unsubscribed?status=error", req.url));
  }

  const { data, error } = await supabase
    .from("email_subscriptions")
    .update({ confirmed: false })
    .eq("unsubscribe_token", token)
    .select("id");

  if (error || !data || data.length === 0) {
    return NextResponse.redirect(new URL("/unsubscribed?status=error", req.url));
  }

  return NextResponse.redirect(new URL("/unsubscribed?status=success", req.url));
}

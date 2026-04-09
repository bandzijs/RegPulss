import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/utils/supabase/server';
import { createServiceRoleSupabaseClient } from '@/utils/supabase/service-role';

export const runtime = 'nodejs';
export const maxDuration = 10;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-bot-secret',
};

function isAdminEmail(email: string | undefined): boolean {
  const allowed = process.env.ADMIN_EMAILS?.split(',') ?? [];
  return Boolean(email && allowed.includes(email));
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

async function querySupabase(query: string) {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/${query}`;
  const response = await fetch(url, {
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });
  return response.json();
}

export async function GET(request: NextRequest) {
  void request;
  try {
    const data = await querySupabase(
      'newsletters?select=id,title,subject,status,source_urls,created_at,sent_at,html_content,json_content&order=created_at.desc&limit=50'
    );
    return NextResponse.json({ drafts: Array.isArray(data) ? data : [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('GET /api/drafts error:', message);
    return NextResponse.json({ drafts: [] });
  }
}

interface CreateDraftBody {
  title?: string;
  subject?: string;
  html_content?: string;
  json_content?: unknown;
  source_urls?: string[];
}

export async function POST(request: Request) {
  const botSecret = request.headers.get('x-bot-secret');
  const isBotAuthorized =
    Boolean(botSecret) && botSecret === process.env.BOT_SECRET;

  if (!isBotAuthorized) {
    const authClient = createServerClient();
    const {
      data: { user },
    } = await authClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAdminEmail(user.email ?? undefined)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  let body: CreateDraftBody;
  try {
    body = (await request.json()) as CreateDraftBody;
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const subject = body.subject?.trim() ?? '';
  const htmlTrimmed = body.html_content?.trim() ?? '';
  const title =
    body.title?.trim() ||
    (subject ? subject.slice(0, 120) : 'Untitled draft');

  if (!htmlTrimmed) {
    return NextResponse.json(
      { error: 'html_content is required' },
      { status: 400 }
    );
  }

  const json_content =
    body.json_content !== undefined && body.json_content !== null
      ? body.json_content
      : {};

  const source_urls = Array.isArray(body.source_urls)
    ? body.source_urls
    : [];

  const supabase = createServiceRoleSupabaseClient();
  if (!supabase) {
    console.error(
      'Drafts POST: missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY'
    );
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    );
  }

  const { data, error } = await supabase
    .from('newsletters')
    .insert({
      title,
      subject,
      html_content: htmlTrimmed || null,
      json_content: json_content || null,
      source_urls: source_urls || [],
      status: 'draft',
    })
    .select()
    .single();

  if (error) {
    console.error('Supabase draft insert error:', JSON.stringify(error));
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ draft: data });
}

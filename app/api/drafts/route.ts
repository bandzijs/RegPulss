import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/utils/supabase/server';
import { createServiceRoleSupabaseClient } from '@/utils/supabase/service-role';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

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

export async function GET(request: NextRequest) {
  void request;
  try {
    const supabase = createSupabaseClient(supabaseUrl, supabaseServiceKey);
    const { data, error } = await supabase
      .from('newsletters')
      .select(
        'id, title, subject, status, source_urls, created_at, sent_at, html_content, json_content'
      )
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error.message);
      return NextResponse.json({ drafts: [] }, { status: 200 });
    }

    return NextResponse.json({ drafts: data ?? [] }, { status: 200 });
  } catch (err) {
    console.error('GET /api/drafts error:', err);
    return NextResponse.json({ drafts: [] }, { status: 200 });
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

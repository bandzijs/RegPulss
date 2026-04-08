import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/utils/supabase/server';
import { createServiceRoleSupabaseClient } from '@/utils/supabase/service-role';

function isAdminEmail(email: string | undefined): boolean {
  const allowed = process.env.ADMIN_EMAILS?.split(',') ?? [];
  return Boolean(email && allowed.includes(email));
}

export async function GET() {
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

  const supabase = createServiceRoleSupabaseClient();
  if (!supabase) {
    console.error(
      'Drafts GET: missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY'
    );
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    );
  }

  const { data, error } = await supabase
    .from('newsletters')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch newsletters:', JSON.stringify(error));
    return NextResponse.json(
      { error: 'Failed to load drafts' },
      { status: 500 }
    );
  }

  return NextResponse.json({ drafts: data ?? [] });
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

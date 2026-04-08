import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

function isAdminEmail(email: string | undefined): boolean {
  const allowed = process.env.ADMIN_EMAILS?.split(',') ?? [];
  return Boolean(email && allowed.includes(email));
}

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isAdminEmail(user.email ?? undefined)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data, error } = await supabase
    .from('newsletters')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch newsletters:', error);
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
  status?: string;
}

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isAdminEmail(user.email ?? undefined)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: CreateDraftBody;
  try {
    body = (await request.json()) as CreateDraftBody;
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const subject = body.subject?.trim() ?? '';
  const html_content = body.html_content?.trim() ?? '';
  const title =
    body.title?.trim() ||
    (subject ? subject.slice(0, 120) : 'Untitled draft');

  if (!html_content) {
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

  const status = body.status === 'sent' ? 'sent' : 'draft';

  const { data, error } = await supabase
    .from('newsletters')
    .insert({
      title,
      subject,
      html_content,
      json_content,
      source_urls,
      status,
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create draft:', error);
    return NextResponse.json(
      { error: 'Failed to save draft' },
      { status: 500 }
    );
  }

  return NextResponse.json({ draft: data });
}

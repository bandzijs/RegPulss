import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

function isAdminEmail(email: string | undefined): boolean {
  const allowed = process.env.ADMIN_EMAILS?.split(',') ?? [];
  return Boolean(email && allowed.includes(email));
}

interface PatchDraftBody {
  title?: string;
  subject?: string;
  html_content?: string;
  json_content?: unknown;
  status?: string;
  sent_at?: string | null;
  source_urls?: string[];
}

export async function GET(
  _request: Request,
  context: { params: { id: string } }
) {
  const { id } = context.params;
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
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Failed to fetch draft:', error);
    return NextResponse.json({ error: 'Failed to load draft' }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ draft: data });
}

export async function PATCH(
  request: Request,
  context: { params: { id: string } }
) {
  const { id } = context.params;
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

  let body: PatchDraftBody;
  try {
    body = (await request.json()) as PatchDraftBody;
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};

  if (body.title !== undefined) {
    patch.title = body.title;
  }
  if (body.subject !== undefined) {
    patch.subject = body.subject;
  }
  if (body.html_content !== undefined) {
    patch.html_content = body.html_content;
  }
  if (body.json_content !== undefined) {
    patch.json_content = body.json_content;
  }
  if (body.status !== undefined) {
    patch.status = body.status;
  }
  if (body.sent_at !== undefined) {
    patch.sent_at = body.sent_at;
  }
  if (body.source_urls !== undefined) {
    patch.source_urls = body.source_urls;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('newsletters')
    .update(patch)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Failed to update draft:', error);
    return NextResponse.json({ error: 'Failed to update draft' }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ draft: data });
}

export async function DELETE(
  _request: Request,
  context: { params: { id: string } }
) {
  const { id } = context.params;
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

  const { error } = await supabase.from('newsletters').delete().eq('id', id);

  if (error) {
    console.error('Failed to delete draft:', error);
    return NextResponse.json({ error: 'Failed to delete draft' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

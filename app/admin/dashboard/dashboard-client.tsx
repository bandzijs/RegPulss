'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { useRouter } from 'next/navigation';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Archive,
  BarChart3,
  Bolt,
  Expand,
  FileText,
  Mail,
  Monitor,
  Settings,
  Smartphone,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import AdminLogoutButton from './logout-button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import DashboardEmailEditor, { type EmailEditorHandle } from './email-editor';

interface Subscriber {
  id: string;
  email: string;
  created_at: string;
}

interface GrowthPoint {
  date: string;
  total: number;
}

export interface NewsletterDraft {
  id: string;
  title: string | null;
  subject: string | null;
  html_content: string | null;
  json_content: unknown;
  status: string;
  source_urls: string[] | null;
  created_at: string;
  sent_at: string | null;
}

interface DashboardClientProps {
  userEmail: string;
  subscribers: Subscriber[];
  loadError?: string;
  draftsCount: number;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}

function createGrowthSeries(subscribers: Subscriber[]): GrowthPoint[] {
  const totalsByDay = new Map<string, number>();

  subscribers
    .slice()
    .sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
    .forEach((entry) => {
      const dayKey = entry.created_at.slice(0, 10);
      const current = totalsByDay.get(dayKey) ?? 0;
      totalsByDay.set(dayKey, current + 1);
    });

  let runningTotal = 0;
  return Array.from(totalsByDay.entries()).map(([date, count]) => {
    runningTotal += count;
    return { date, total: runningTotal };
  });
}

function renderPreview(subject: string, html: string) {
  return (
    <Card className="bg-[#fdfcf9] border-[var(--color-border)] shadow-sm">
      <CardHeader className="pb-3">
        <CardDescription className="uppercase tracking-wider text-xs">
          Newsletter Preview
        </CardDescription>
        <CardTitle className="font-[family-name:var(--font-serif)] text-2xl">
          {subject || '(No subject)'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <iframe
          title="Newsletter preview"
          className="w-full min-h-[600px] rounded-md border border-[var(--color-border)] bg-white"
          srcDoc={html}
        />
      </CardContent>
    </Card>
  );
}

function getTrend(growthData: GrowthPoint[]): { value: string; positive: boolean } {
  if (growthData.length < 2) {
    return { value: '+0%', positive: true };
  }

  const latest = growthData[growthData.length - 1]?.total ?? 0;
  const previous = growthData[growthData.length - 2]?.total ?? 0;

  if (previous <= 0) {
    return { value: '+100%', positive: true };
  }

  const percentage = ((latest - previous) / previous) * 100;
  const sign = percentage >= 0 ? '+' : '';
  return { value: `${sign}${percentage.toFixed(1)}%`, positive: percentage >= 0 };
}

type SidebarSection =
  | 'dashboard'
  | 'drafts'
  | 'archive'
  | 'subscribers'
  | 'newsletter'
  | 'settings';

const navItems: {
  id: SidebarSection;
  label: string;
  icon: typeof BarChart3;
}[] = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'drafts', label: 'Drafts', icon: FileText },
  { id: 'archive', label: 'Archive', icon: Archive },
  { id: 'subscribers', label: 'Subscribers', icon: Users },
  { id: 'newsletter', label: 'Newsletter Editor', icon: Mail },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const NEWSLETTER_DESIGN_KEY = 'regpulss_email_design';
type PreviewViewport = 'desktop' | 'mobile';

function sidebarInitials(email: string): string {
  return email.slice(0, 2).toUpperCase();
}

function formatGrowthLabel(date: string): string {
  return new Date(date).toLocaleDateString('en-GB', {
    month: 'short',
    day: '2-digit',
  });
}

function showToast(
  setToast: Dispatch<
    SetStateAction<{
      message: string;
      type: 'success' | 'error';
    } | null>
  >,
  message: string,
  type: 'success' | 'error'
) {
  setToast({ message, type });
}

function draftHasJsonContent(json: unknown): boolean {
  if (json == null) {
    return false;
  }
  if (typeof json !== 'object' || Array.isArray(json)) {
    return false;
  }
  return Object.keys(json as Record<string, unknown>).length > 0;
}

export default function DashboardClient({
  userEmail,
  subscribers,
  loadError,
  draftsCount: draftsCountProp,
}: DashboardClientProps) {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<SidebarSection>(
    'subscribers'
  );
  const [pendingDraftsCount, setPendingDraftsCount] = useState(draftsCountProp);
  const [query, setQuery] = useState('');
  const [subject, setSubject] = useState('');
  const [previewHtml, setPreviewHtml] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [previewViewport, setPreviewViewport] = useState<PreviewViewport>('desktop');
  const [editorReady, setEditorReady] = useState(false);
  const [initialDesign, setInitialDesign] = useState<object | undefined>(
    undefined
  );
  const [editorDesignKey, setEditorDesignKey] = useState(0);
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<NewsletterDraft[]>([]);
  const [draftsLoading, setDraftsLoading] = useState(false);
  const [draftsError, setDraftsError] = useState<string | null>(null);
  const [draftActionId, setDraftActionId] = useState<string | null>(null);
  const [draftPreviewLoadingId, setDraftPreviewLoadingId] = useState<
    string | null
  >(null);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);
  const [isFullscreenEditor, setIsFullscreenEditor] = useState(false);
  const [htmlDraftMode, setHtmlDraftMode] = useState(false);
  const [rawHtmlContent, setRawHtmlContent] = useState('');
  const [isDesignSaved, setIsDesignSaved] = useState(false);
  const [sendState, setSendState] = useState<{
    status: 'idle' | 'loading' | 'success' | 'error';
    message: string;
  }>({ status: 'idle', message: '' });
  const emailEditorRef = useRef<EmailEditorHandle | null>(null);
  const uploadJsonInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setPendingDraftsCount(draftsCountProp);
  }, [draftsCountProp]);

  useEffect(() => {
    if (!toast) {
      return;
    }
    const t = window.setTimeout(() => setToast(null), 4500);
    return () => window.clearTimeout(t);
  }, [toast]);

  async function refreshDraftsCount() {
    try {
      const res = await fetch('/api/drafts');
      const payload = (await res.json()) as { drafts?: NewsletterDraft[] };
      if (!res.ok || !payload.drafts) {
        return;
      }
      const pending = payload.drafts.filter((d) => d.status === 'draft').length;
      setPendingDraftsCount(pending);
      router.refresh();
    } catch {
      // ignore
    }
  }

  const loadDraftsList = useCallback(async () => {
    setDraftsLoading(true);
    setDraftsError(null);
    try {
      const res = await fetch('/api/drafts');
      const payload = (await res.json()) as
        | { drafts: NewsletterDraft[] }
        | { error: string };
      if (!res.ok || !('drafts' in payload)) {
        setDraftsError(
          'error' in payload ? payload.error : 'Failed to load drafts'
        );
        return;
      }
      setDrafts(payload.drafts);
    } catch (e) {
      console.error(e);
      setDraftsError('Failed to load drafts');
    } finally {
      setDraftsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeSection === 'drafts' || activeSection === 'archive') {
      void loadDraftsList();
    }
  }, [activeSection, loadDraftsList]);

  const filteredSubscribers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return subscribers;
    }
    return subscribers.filter((entry) =>
      entry.email.toLowerCase().includes(normalized)
    );
  }, [query, subscribers]);
  const draftItems = useMemo(
    () => drafts.filter((entry) => entry.status?.toLowerCase() === 'draft'),
    [drafts]
  );
  const archivedItems = useMemo(
    () => drafts.filter((entry) => entry.status?.toLowerCase() === 'archived'),
    [drafts]
  );

  const growthData = useMemo(
    () => createGrowthSeries(subscribers),
    [subscribers]
  );
  const trend = useMemo(() => getTrend(growthData), [growthData]);
  const emailBodyStats = useMemo(() => {
    const source = htmlDraftMode ? rawHtmlContent : previewHtml;
    const text = source
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const characters = text.length;
    const words = text ? text.split(' ').length : 0;
    return { words, characters };
  }, [htmlDraftMode, rawHtmlContent, previewHtml]);

  const newsletterReady = htmlDraftMode || editorReady;

  async function handlePreviewNewsletter() {
    if (!subject.trim()) {
      setSendState({
        status: 'error',
        message: 'Subject is required.',
      });
      return;
    }

    if (htmlDraftMode) {
      const html = rawHtmlContent.trim();
      if (!html) {
        setSendState({
          status: 'error',
          message: 'Add HTML content before preview.',
        });
        return;
      }
      setPreviewHtml(html);
      setShowPreview(true);
      setSendState({ status: 'idle', message: '' });
      return;
    }

    try {
      const html = await emailEditorRef.current?.getHtml();
      if (!html) {
        setSendState({
          status: 'error',
          message: 'Email editor is not ready yet.',
        });
        return;
      }
      setPreviewHtml(html);
      setShowPreview(true);
      setSendState({ status: 'idle', message: '' });
    } catch (error) {
      console.error('Preview export failed:', error);
      setSendState({
        status: 'error',
        message: 'Failed to generate preview from the email editor.',
      });
    }
  }

  async function handleSaveDesign() {
    try {
      const design = await emailEditorRef.current?.getJson();
      if (!design) {
        setSendState({
          status: 'error',
          message: 'Email editor is not ready yet.',
        });
        return;
      }

      window.localStorage.setItem(NEWSLETTER_DESIGN_KEY, JSON.stringify(design));
      setIsDesignSaved(true);
      setSendState({
        status: 'success',
        message: 'Design saved locally.',
      });
    } catch (error) {
      console.error('Save design failed:', error);
      setSendState({
        status: 'error',
        message: 'Failed to save design.',
      });
    }
  }

  function handleUploadDesignFromStorage() {
    try {
      const raw = window.localStorage.getItem(NEWSLETTER_DESIGN_KEY);
      if (!raw) {
        setSendState({
          status: 'error',
          message: 'No saved design found',
        });
        return;
      }

      const parsed = JSON.parse(raw) as object;
      console.log('Loading design from localStorage:', parsed);
      if (!emailEditorRef.current) {
        setSendState({
          status: 'error',
          message: 'Email editor is not ready yet.',
        });
        return;
      }
      emailEditorRef.current?.loadDesign(parsed);
      setIsDesignSaved(true);
      setSendState({
        status: 'success',
        message: 'Saved design loaded.',
      });
    } catch (error) {
      console.error('Load design failed:', error);
      setSendState({
        status: 'error',
        message: 'Failed to load saved design.',
      });
    }
  }

  async function handleDownloadDesign() {
    try {
      const design = await emailEditorRef.current?.getJson();
      if (!design) {
        setSendState({
          status: 'error',
          message: 'Email editor is not ready yet.',
        });
        return;
      }

      const blob = new Blob([JSON.stringify(design, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'regpulss-email-design.json';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      setSendState({
        status: 'success',
        message: 'Design JSON downloaded.',
      });
    } catch (error) {
      console.error('Download design failed:', error);
      setSendState({
        status: 'error',
        message: 'Failed to download design JSON.',
      });
    }
  }

  function handleUploadDesignClick() {
    uploadJsonInputRef.current?.click();
  }

  async function handleUploadDesignFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const content = await file.text();
      const parsed = JSON.parse(content) as object;
      console.log('Loading design from uploaded JSON:', parsed);
      emailEditorRef.current?.loadDesign(parsed);
      window.localStorage.setItem(NEWSLETTER_DESIGN_KEY, JSON.stringify(parsed));
      setIsDesignSaved(true);
      setSendState({
        status: 'success',
        message: 'Design uploaded successfully.',
      });
    } catch (error) {
      console.error('Upload design failed:', error);
      setSendState({
        status: 'error',
        message: 'Invalid JSON file. Could not load design.',
      });
    } finally {
      event.target.value = '';
    }
  }

  function handleEditDraft(draft: NewsletterDraft) {
    setSubject(draft.subject ?? '');
    setEditingDraftId(draft.id);
    setIsDesignSaved(false);
    setActiveSection('newsletter');
    setIsFullscreenEditor(false);

    if (draftHasJsonContent(draft.json_content)) {
      setHtmlDraftMode(false);
      setRawHtmlContent('');
      setEditorReady(false);
      setInitialDesign(draft.json_content as object);
      setEditorDesignKey((k) => k + 1);
      setPreviewHtml(draft.html_content ?? '');
    } else {
      setHtmlDraftMode(true);
      setEditorReady(false);
      setInitialDesign(undefined);
      const html = draft.html_content ?? '';
      setRawHtmlContent(html);
      setPreviewHtml(html);
      setEditorDesignKey((k) => k + 1);
    }
  }

  async function handleSaveHtmlDraftChanges() {
    if (!editingDraftId || !htmlDraftMode) {
      showToast(setToast, 'No AI draft is being edited.', 'error');
      return;
    }

    const html = rawHtmlContent.trim();
    if (!html) {
      showToast(setToast, 'HTML content is required.', 'error');
      return;
    }

    const title = subject.trim() || 'Untitled draft';
    const subj = subject.trim();

    try {
      const res = await fetch(`/api/drafts/${editingDraftId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          subject: subj,
          html_content: html,
        }),
      });
      const payload = (await res.json()) as { error?: string };
      if (!res.ok) {
        showToast(
          setToast,
          payload.error ?? 'Failed to save draft',
          'error'
        );
        return;
      }
      showToast(setToast, 'Draft saved.', 'success');
      void refreshDraftsCount();
      void loadDraftsList();
    } catch (error) {
      console.error(error);
      showToast(setToast, 'Failed to save draft.', 'error');
    }
  }

  async function handleSaveAsDraft() {
    if (htmlDraftMode) {
      const html = rawHtmlContent.trim();
      if (!html) {
        showToast(setToast, 'Add content before saving a draft.', 'error');
        return;
      }

      const title = subject.trim() || 'Untitled draft';
      const subj = subject.trim();

      try {
        if (editingDraftId) {
          const res = await fetch(`/api/drafts/${editingDraftId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title,
              subject: subj,
              html_content: html,
            }),
          });
          const payload = (await res.json()) as { error?: string };
          if (!res.ok) {
            showToast(
              setToast,
              payload.error ?? 'Failed to save draft',
              'error'
            );
            return;
          }
          showToast(setToast, 'Draft saved.', 'success');
        } else {
          const res = await fetch('/api/drafts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title,
              subject: subj,
              html_content: html,
              json_content: {},
            }),
          });
          const payload = (await res.json()) as {
            error?: string;
            draft?: { id: string };
          };
          if (!res.ok) {
            showToast(
              setToast,
              payload.error ?? 'Failed to save draft',
              'error'
            );
            return;
          }
          if (payload.draft?.id) {
            setEditingDraftId(payload.draft.id);
          }
          showToast(setToast, 'Draft saved.', 'success');
        }
        void refreshDraftsCount();
        void loadDraftsList();
      } catch (error) {
        console.error(error);
        showToast(setToast, 'Failed to save draft.', 'error');
      }
      return;
    }

    if (!editorReady) {
      showToast(setToast, 'Email editor is not ready yet.', 'error');
      return;
    }

    let html = '';
    let json: object | null = null;
    try {
      html = (await emailEditorRef.current?.getHtml()) ?? '';
      json = (await emailEditorRef.current?.getJson()) ?? null;
    } catch (error) {
      console.error(error);
      showToast(setToast, 'Failed to read the email editor.', 'error');
      return;
    }

    if (!html.trim()) {
      showToast(setToast, 'Add content before saving a draft.', 'error');
      return;
    }

    const title = subject.trim() || 'Untitled draft';
    const subj = subject.trim();

    try {
      if (editingDraftId) {
        const res = await fetch(`/api/drafts/${editingDraftId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            subject: subj,
            html_content: html,
            json_content: json ?? {},
          }),
        });
        const payload = (await res.json()) as { error?: string };
        if (!res.ok) {
          showToast(
            setToast,
            payload.error ?? 'Failed to save draft',
            'error'
          );
          return;
        }
        showToast(setToast, 'Draft saved.', 'success');
      } else {
        const res = await fetch('/api/drafts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            subject: subj,
            html_content: html,
            json_content: json ?? {},
          }),
        });
        const payload = (await res.json()) as {
          error?: string;
          draft?: { id: string };
        };
        if (!res.ok) {
          showToast(
            setToast,
            payload.error ?? 'Failed to save draft',
            'error'
          );
          return;
        }
        if (payload.draft?.id) {
          setEditingDraftId(payload.draft.id);
        }
        showToast(setToast, 'Draft saved.', 'success');
      }
      void refreshDraftsCount();
      void loadDraftsList();
    } catch (error) {
      console.error(error);
      showToast(setToast, 'Failed to save draft.', 'error');
    }
  }

  async function handleSendDraft(draft: NewsletterDraft) {
    const confirmed = window.confirm(
      `Send newsletter to all subscribers?\n\nSubject: ${draft.subject ?? '(no subject)'}`
    );
    if (!confirmed) {
      return;
    }

    const html = draft.html_content ?? '';
    const subj = (draft.subject ?? '').trim();
    if (!subj || !html.trim()) {
      showToast(setToast, 'Draft is missing subject or HTML.', 'error');
      return;
    }

    setDraftActionId(draft.id);
    try {
      const response = await fetch('/api/send-newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: subj, html }),
      });

      const payload = (await response.json()) as
        | { success: true; message: string }
        | { success: false; error: string };

      if (!response.ok || !payload.success) {
        showToast(
          setToast,
          'error' in payload ? payload.error : 'Failed to send newsletter',
          'error'
        );
        return;
      }

      const patchRes = await fetch(`/api/drafts/${draft.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'sent',
          sent_at: new Date().toISOString(),
        }),
      });

      if (!patchRes.ok) {
        showToast(
          setToast,
          'Newsletter sent, but draft status could not be updated.',
          'error'
        );
      } else {
        showToast(setToast, payload.message, 'success');
      }

      void loadDraftsList();
      void refreshDraftsCount();
    } catch (error) {
      console.error(error);
      showToast(setToast, 'Failed to send newsletter.', 'error');
    } finally {
      setDraftActionId(null);
    }
  }

  async function handleDeleteDraft(draft: NewsletterDraft) {
    const confirmed = window.confirm(
      `Delete draft "${draft.title || draft.subject || 'Untitled'}"?`
    );
    if (!confirmed) {
      return;
    }

    setDraftActionId(draft.id);
    try {
      const res = await fetch(`/api/drafts/${draft.id}`, { method: 'DELETE' });
      const payload = (await res.json()) as { error?: string };
      if (!res.ok) {
        showToast(setToast, payload.error ?? 'Failed to delete draft', 'error');
        return;
      }
      showToast(setToast, 'Draft deleted.', 'success');
      if (editingDraftId === draft.id) {
        setEditingDraftId(null);
        setHtmlDraftMode(false);
        setRawHtmlContent('');
      }
      void loadDraftsList();
      void refreshDraftsCount();
    } catch (error) {
      console.error(error);
      showToast(setToast, 'Failed to delete draft.', 'error');
    } finally {
      setDraftActionId(null);
    }
  }

  async function handleArchiveDraft(draft: NewsletterDraft) {
    const confirmed = window.confirm('Move to archive?');
    if (!confirmed) {
      return;
    }

    setDraftActionId(draft.id);
    try {
      const res = await fetch(`/api/drafts/${draft.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'archived' }),
      });
      const payload = (await res.json()) as { error?: string };
      if (!res.ok) {
        showToast(setToast, payload.error ?? 'Failed to archive draft', 'error');
        return;
      }
      showToast(setToast, 'Draft archived.', 'success');
      if (editingDraftId === draft.id) {
        setEditingDraftId(null);
        setHtmlDraftMode(false);
        setRawHtmlContent('');
      }
      void loadDraftsList();
      void refreshDraftsCount();
    } catch (error) {
      console.error(error);
      showToast(setToast, 'Failed to archive draft.', 'error');
    } finally {
      setDraftActionId(null);
    }
  }

  async function handleRestoreDraft(draft: NewsletterDraft) {
    setDraftActionId(draft.id);
    try {
      const res = await fetch(`/api/drafts/${draft.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'draft' }),
      });
      const payload = (await res.json()) as { error?: string };
      if (!res.ok) {
        showToast(setToast, payload.error ?? 'Failed to restore draft', 'error');
        return;
      }
      showToast(setToast, 'Draft restored.', 'success');
      void loadDraftsList();
      void refreshDraftsCount();
    } catch (error) {
      console.error(error);
      showToast(setToast, 'Failed to restore draft.', 'error');
    } finally {
      setDraftActionId(null);
    }
  }

  async function handlePreviewDraftFromCard(draft: NewsletterDraft) {
    setDraftPreviewLoadingId(draft.id);
    try {
      const res = await fetch(`/api/drafts/${draft.id}`);
      const payload = (await res.json()) as
        | { draft: NewsletterDraft }
        | { error: string };
      if (!res.ok || !('draft' in payload)) {
        showToast(
          setToast,
          'error' in payload ? payload.error : 'Failed to load draft',
          'error'
        );
        return;
      }
      setSubject(payload.draft.subject ?? '');
      setPreviewHtml(payload.draft.html_content ?? '');
      setShowPreview(true);
      setSendState({ status: 'idle', message: '' });
    } catch (error) {
      console.error(error);
      showToast(setToast, 'Failed to load draft preview.', 'error');
    } finally {
      setDraftPreviewLoadingId(null);
    }
  }

  async function handleSendNewsletter() {
    if (!subject.trim()) {
      setSendState({
        status: 'error',
        message: 'Subject is required.',
      });
      return;
    }

    let html = '';
    if (htmlDraftMode) {
      html = rawHtmlContent.trim();
    } else {
      try {
        const exported = await emailEditorRef.current?.getHtml();
        html = exported ?? '';
      } catch (error) {
        console.error('Send export failed:', error);
        setSendState({
          status: 'error',
          message: 'Failed to export HTML from the email editor.',
        });
        return;
      }
    }

    if (!html.trim()) {
      setSendState({
        status: 'error',
        message: 'Please design your email before sending',
      });
      return;
    }

    setSendState({ status: 'loading', message: '' });

    try {
      const response = await fetch('/api/send-newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: subject.trim(),
          html,
        }),
      });

      const payload = (await response.json()) as
        | { success: true; message: string }
        | { success: false; error: string };

      if (!response.ok || !payload.success) {
        const errMsg =
          'error' in payload
            ? payload.error
            : 'Failed to send newsletter.';
        setSendState({
          status: 'error',
          message: errMsg,
        });
        showToast(setToast, errMsg, 'error');
        return;
      }

      setSendState({ status: 'success', message: payload.message });
      setPreviewHtml(html);
      showToast(setToast, payload.message, 'success');

      if (editingDraftId) {
        const patchRes = await fetch(`/api/drafts/${editingDraftId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'sent',
            sent_at: new Date().toISOString(),
          }),
        });
        if (!patchRes.ok) {
          showToast(
            setToast,
            'Sent, but draft could not be marked as sent.',
            'error'
          );
        }
        void refreshDraftsCount();
        void loadDraftsList();
      }
    } catch (error) {
      console.error('Newsletter send failed:', error);
      const errMsg = 'Unexpected error while sending newsletter.';
      setSendState({
        status: 'error',
        message: errMsg,
      });
      showToast(setToast, errMsg, 'error');
    }
  }

  return (
    <main className="min-h-screen bg-white text-[var(--color-text-primary)]">
      <div className="grid min-h-screen md:grid-cols-[260px_1fr]">
        <aside className="bg-gray-950 text-white flex flex-col border-r border-gray-800">
          <div className="px-6 py-6">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-md bg-[#E53E3E]">
                <Bolt className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold">RegPulss Admin</p>
                <p className="text-xs text-gray-400">Control panel</p>
              </div>
            </div>
          </div>
          <Separator className="bg-gray-800" />
          <nav className="px-3 py-4 space-y-1">
            {navItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                className={cn(
                  'w-full flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                  id === 'settings'
                    ? 'text-gray-500 cursor-not-allowed'
                    : id === activeSection
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-200 hover:bg-gray-900'
                )}
                disabled={id === 'settings'}
                onClick={() => {
                  if (id === 'settings') {
                    return;
                  }
                  setActiveSection(id);
                }}
              >
                <span className="flex items-center gap-3 min-w-0">
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{label}</span>
                </span>
                {id === 'drafts' && pendingDraftsCount > 0 ? (
                  <Badge className="shrink-0 border-0 bg-yellow-500 text-gray-950 hover:bg-yellow-500">
                    {pendingDraftsCount}
                  </Badge>
                ) : null}
              </button>
            ))}
          </nav>
          <div className="mt-auto p-4">
            <Card className="border-gray-800 bg-gray-900 text-white">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-[#E53E3E] text-white">
                      {sidebarInitials(userEmail)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm">{userEmail}</p>
                    <p className="text-xs text-gray-400">Administrator</p>
                  </div>
                </div>
                <AdminLogoutButton className="cta-button w-full" />
              </CardContent>
            </Card>
          </div>
        </aside>

        <section className="bg-white p-6 md:p-8 lg:p-10 space-y-6">
          <header className="space-y-1">
            <h1 className="text-3xl font-bold font-[family-name:var(--font-serif)]">
              Dashboard
            </h1>
            <p className="text-muted-foreground">
              Manage subscribers and send RegPulss newsletters.
            </p>
          </header>

          <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardDescription>Total Subscribers</CardDescription>
                <CardTitle className="text-4xl">{subscribers.length}</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge
                  variant="secondary"
                  className={cn(
                    trend.positive
                      ? 'bg-red-50 text-[#E53E3E]'
                      : 'bg-gray-100 text-gray-700'
                  )}
                >
                  {trend.value} since last day
                </Badge>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Subscriber Growth</CardTitle>
                <CardDescription>Cumulative signups over time</CardDescription>
              </CardHeader>
              <CardContent className="h-[11.2rem] min-h-[11.2rem]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={growthData}>
                    <defs>
                      <linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#E53E3E" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#E53E3E" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatGrowthLabel}
                      tick={{ fill: '#737373', fontSize: 12 }}
                    />
                    <YAxis tick={{ fill: '#737373', fontSize: 12 }} />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="total"
                      stroke="#E53E3E"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#growthFill)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {loadError ? (
            <p className="text-sm text-[#E53E3E]">{loadError}</p>
          ) : null}

          {activeSection === 'dashboard' ? (
            <Card className="shadow-sm mt-4">
              <CardHeader>
                <CardTitle>Overview</CardTitle>
                <CardDescription>
                  Key metrics at a glance. Use the sidebar to open subscribers,
                  drafts, or the newsletter composer.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : null}

          {activeSection === 'drafts' ? (
            <div className="mt-4 space-y-4">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>Drafts</CardTitle>
                  <CardDescription>
                    Saved newsletter drafts and AI-generated drafts.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {draftsLoading ? (
                    <p className="text-sm text-muted-foreground">Loading drafts…</p>
                  ) : draftsError ? (
                    <p className="text-sm text-[#E53E3E]">{draftsError}</p>
                  ) : draftItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No drafts yet. The AI bot will save drafts here automatically.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                      {draftItems.map((draft) => {
                        const busy = draftActionId === draft.id;
                        return (
                          <Card key={draft.id} className="border shadow-sm">
                            <CardHeader className="p-3 pb-2">
                              <div className="flex items-start justify-between gap-2">
                                <CardTitle className="text-sm font-semibold leading-tight">
                                  {draft.title || draft.subject || 'Untitled'}
                                </CardTitle>
                                <Badge
                                  className={cn(
                                    'shrink-0 border-0 bg-yellow-100 text-yellow-900 hover:bg-yellow-100 text-[10px]'
                                  )}
                                >
                                  Draft
                                </Badge>
                              </div>
                              <CardDescription className="text-xs text-foreground/90">
                                {draft.subject || '(No subject line)'}
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="p-3 pt-0 space-y-2 text-xs">
                              <p className="text-xs text-muted-foreground">
                                Created {formatDate(draft.created_at)}
                              </p>
                              {draft.source_urls &&
                              draft.source_urls.filter(Boolean).length > 0 ? (
                                <div className="space-y-1">
                                  <p className="text-xs text-muted-foreground">
                                    Sources
                                  </p>
                                  <ul className="flex flex-wrap gap-2">
                                    {draft.source_urls.filter(Boolean).map(
                                      (url, idx) => (
                                        <li key={`${draft.id}-src-${idx}`}>
                                          <a
                                            href={url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-[#E53E3E] underline break-all"
                                          >
                                            {url.length > 48
                                              ? `${url.slice(0, 46)}…`
                                              : url}
                                          </a>
                                        </li>
                                      )
                                    )}
                                  </ul>
                                </div>
                              ) : null}
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="text-xs h-8"
                                  disabled={busy}
                                  onClick={() => handleEditDraft(draft)}
                                >
                                  Edit
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="text-xs h-8"
                                  disabled={
                                    busy || draftPreviewLoadingId === draft.id
                                  }
                                  onClick={() => void handlePreviewDraftFromCard(draft)}
                                >
                                  Preview
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  disabled={busy}
                                  className="bg-[#E53E3E] text-white hover:bg-[#c53030] text-xs h-8"
                                  onClick={() => void handleSendDraft(draft)}
                                >
                                  Send
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="text-xs h-8 text-gray-700"
                                  disabled={busy}
                                  onClick={() => void handleArchiveDraft(draft)}
                                >
                                  Archive
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="text-xs h-8 text-[#E53E3E] border-[#fecaca]"
                                  disabled={busy}
                                  onClick={() => void handleDeleteDraft(draft)}
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Delete
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : null}

          {activeSection === 'archive' ? (
            <div className="mt-4 space-y-4">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>Archive</CardTitle>
                  <CardDescription>Archived newsletters.</CardDescription>
                </CardHeader>
                <CardContent>
                  {draftsLoading ? (
                    <p className="text-sm text-muted-foreground">Loading archive…</p>
                  ) : draftsError ? (
                    <p className="text-sm text-[#E53E3E]">{draftsError}</p>
                  ) : archivedItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No archived newsletters yet.
                    </p>
                  ) : (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Subject</TableHead>
                            <TableHead>Created Date</TableHead>
                            <TableHead>Sources count</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {archivedItems.map((draft) => {
                            const busy = draftActionId === draft.id;
                            return (
                              <TableRow key={draft.id}>
                                <TableCell className="font-medium">
                                  {draft.title || 'Untitled'}
                                </TableCell>
                                <TableCell>{draft.subject || '(No subject)'}</TableCell>
                                <TableCell className="text-muted-foreground">
                                  {formatDate(draft.created_at)}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                  {draft.source_urls?.filter(Boolean).length ?? 0}
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-wrap gap-2">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      disabled={busy}
                                      onClick={() => void handlePreviewDraftFromCard(draft)}
                                    >
                                      View
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      disabled={busy}
                                      onClick={() => void handleRestoreDraft(draft)}
                                    >
                                      Restore
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : null}

          {activeSection === 'subscribers' ? (
              <Card className="shadow-sm mt-4">
                <CardHeader>
                  <CardTitle>Subscriber List</CardTitle>
                  <CardDescription>
                    Search and review newsletter subscriptions.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Filter by email..."
                  />
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>#</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Date Subscribed</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredSubscribers.map((entry, index) => (
                          <TableRow
                            key={entry.id}
                            className={cn(
                              'hover:bg-gray-50',
                              index % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'
                            )}
                          >
                            <TableCell className="text-muted-foreground">
                              {index + 1}
                            </TableCell>
                            <TableCell className="font-medium">{entry.email}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {formatDate(entry.created_at)}
                            </TableCell>
                            <TableCell>
                              <Badge className="bg-red-50 text-[#E53E3E] hover:bg-red-50">
                                Active
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {filteredSubscribers.length === 0 ? (
                      <p className="p-4 text-sm text-muted-foreground">
                        No subscribers found.
                      </p>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
          ) : null}

          {activeSection === 'newsletter' ? (
              <div className="mt-4 w-full max-w-none">
                <Card className="w-full max-w-none shadow-sm">
                  <CardHeader>
                    <CardTitle>Newsletter Editor</CardTitle>
                    <CardDescription>
                      Draft and send a bulk message to all subscribers.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="w-full space-y-4">
                    <div className="w-full space-y-2">
                      <label
                        htmlFor="newsletter-subject"
                        className="text-sm text-muted-foreground"
                      >
                        Subject line
                      </label>
                      <Input
                        id="newsletter-subject"
                        className="w-full"
                        value={subject}
                        onChange={(event) => setSubject(event.target.value)}
                        placeholder="Weekly RegPulss updates"
                      />
                    </div>
                    <div className="w-full space-y-2">
                      {htmlDraftMode ? (
                        <>
                          <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                            AI-generated draft — edit HTML directly below
                          </div>
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <label
                              htmlFor="newsletter-html-raw"
                              className="text-sm text-muted-foreground"
                            >
                              Email body (HTML)
                            </label>
                            <div className="flex flex-wrap items-center gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={handlePreviewNewsletter}
                                disabled={sendState.status === 'loading'}
                              >
                                Preview
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => void handleSaveHtmlDraftChanges()}
                                disabled={sendState.status === 'loading'}
                              >
                                Save changes
                              </Button>
                            </div>
                          </div>
                          <textarea
                            id="newsletter-html-raw"
                            className="w-full min-h-[600px] resize-y rounded-md border border-input bg-background p-3 font-mono text-sm leading-relaxed"
                            style={{ height: '600px' }}
                            value={rawHtmlContent}
                            onChange={(event) => {
                              const v = event.target.value;
                              setRawHtmlContent(v);
                              setPreviewHtml(v);
                            }}
                            spellCheck={false}
                          />
                          <p className="text-xs text-muted-foreground">
                            {emailBodyStats.words} words •{' '}
                            {emailBodyStats.characters} characters
                          </p>
                          <div className="border-t border-[var(--color-border)] pt-4">
                            <div className="flex flex-wrap items-center justify-end gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => void handleSaveAsDraft()}
                                disabled={sendState.status === 'loading'}
                              >
                                Save as Draft
                              </Button>
                              <Button
                                type="button"
                                onClick={handleSendNewsletter}
                                disabled={sendState.status === 'loading'}
                                className="bg-[#E53E3E] text-white hover:bg-[#c53030]"
                              >
                                {sendState.status === 'loading'
                                  ? 'Sending...'
                                  : 'Send Newsletter'}
                              </Button>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <label
                              htmlFor="newsletter-editor"
                              className="text-sm text-muted-foreground"
                            >
                              Email body
                            </label>
                            <div className="flex flex-wrap items-center gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() =>
                                  setIsFullscreenEditor((value) => !value)
                                }
                                disabled={!editorReady}
                              >
                                {isFullscreenEditor ? (
                                  <>
                                    <X className="mr-1 h-4 w-4" />
                                    Exit Fullscreen
                                  </>
                                ) : (
                                  <>
                                    <Expand className="mr-1 h-4 w-4" />
                                    Fullscreen
                                  </>
                                )}
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={handlePreviewNewsletter}
                                disabled={
                                  !newsletterReady ||
                                  sendState.status === 'loading'
                                }
                              >
                                Preview
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={handleSaveDesign}
                                disabled={
                                  !newsletterReady ||
                                  sendState.status === 'loading'
                                }
                              >
                                Save Design
                                <span
                                  className={cn(
                                    'ml-2 h-2 w-2 rounded-full',
                                    isDesignSaved
                                      ? 'bg-emerald-500'
                                      : 'bg-gray-400'
                                  )}
                                />
                              </Button>
                            </div>
                          </div>
                          <div
                            className={cn(
                              isFullscreenEditor
                                ? 'fixed inset-0 z-50 bg-white p-4 md:p-6 overflow-y-auto'
                                : ''
                            )}
                          >
                            <div className="w-full">
                              {isFullscreenEditor ? (
                                <div className="mb-4 space-y-4">
                                  <div className="flex items-center justify-between gap-3">
                                    <p className="text-sm text-muted-foreground">
                                      Fullscreen Email Editor
                                    </p>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={() => setIsFullscreenEditor(false)}
                                    >
                                      <X className="mr-1 h-4 w-4" />
                                      Close
                                    </Button>
                                  </div>
                                  <Input
                                    className="w-full"
                                    value={subject}
                                    onChange={(event) =>
                                      setSubject(event.target.value)
                                    }
                                    placeholder="Weekly RegPulss updates"
                                  />
                                  <div className="flex flex-wrap gap-2">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={handleSaveDesign}
                                      disabled={
                                        !newsletterReady ||
                                        sendState.status === 'loading'
                                      }
                                    >
                                      Save Design
                                      <span
                                        className={cn(
                                          'ml-2 h-2 w-2 rounded-full',
                                          isDesignSaved
                                            ? 'bg-emerald-500'
                                            : 'bg-gray-400'
                                        )}
                                      />
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={handleUploadDesignFromStorage}
                                      disabled={
                                        !newsletterReady ||
                                        sendState.status === 'loading'
                                      }
                                    >
                                      Upload Design
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={handleUploadDesignClick}
                                      disabled={
                                        !newsletterReady ||
                                        sendState.status === 'loading'
                                      }
                                    >
                                      Upload JSON
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={handleDownloadDesign}
                                      disabled={
                                        !newsletterReady ||
                                        sendState.status === 'loading'
                                      }
                                    >
                                      Download JSON
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={handlePreviewNewsletter}
                                      disabled={
                                        !newsletterReady ||
                                        sendState.status === 'loading'
                                      }
                                    >
                                      Preview
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={() => void handleSaveAsDraft()}
                                      disabled={
                                        !newsletterReady ||
                                        sendState.status === 'loading'
                                      }
                                    >
                                      Save as Draft
                                    </Button>
                                    <Button
                                      type="button"
                                      onClick={handleSendNewsletter}
                                      disabled={
                                        !newsletterReady ||
                                        sendState.status === 'loading'
                                      }
                                      className="bg-[#E53E3E] text-white hover:bg-[#c53030]"
                                    >
                                      {sendState.status === 'loading'
                                        ? 'Sending...'
                                        : 'Send Newsletter'}
                                    </Button>
                                  </div>
                                </div>
                              ) : null}
                              <DashboardEmailEditor
                                key={editorDesignKey}
                                ref={emailEditorRef}
                                onReady={() => setEditorReady(true)}
                                onExportHtml={(html) => {
                                  setPreviewHtml(html);
                                  setIsDesignSaved(false);
                                }}
                                initialDesign={initialDesign}
                                minHeight={
                                  isFullscreenEditor
                                    ? 'calc(100vh - 130px)'
                                    : 750
                                }
                              />
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {emailBodyStats.words} words •{' '}
                            {emailBodyStats.characters} characters
                          </p>
                          <div className="border-t border-[var(--color-border)] pt-4">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div className="flex flex-wrap items-center gap-3">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={handleUploadDesignFromStorage}
                                  disabled={
                                    !newsletterReady ||
                                    sendState.status === 'loading'
                                  }
                                >
                                  Upload Design
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={handleUploadDesignClick}
                                  disabled={
                                    !newsletterReady ||
                                    sendState.status === 'loading'
                                  }
                                >
                                  Upload JSON
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={handleDownloadDesign}
                                  disabled={
                                    !newsletterReady ||
                                    sendState.status === 'loading'
                                  }
                                >
                                  Download JSON
                                </Button>
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => void handleSaveAsDraft()}
                                  disabled={
                                    !newsletterReady ||
                                    sendState.status === 'loading'
                                  }
                                >
                                  Save as Draft
                                </Button>
                                <Button
                                  type="button"
                                  onClick={handleSendNewsletter}
                                  disabled={
                                    !newsletterReady ||
                                    sendState.status === 'loading'
                                  }
                                  className="bg-[#E53E3E] text-white hover:bg-[#c53030]"
                                >
                                  {sendState.status === 'loading'
                                    ? 'Sending...'
                                    : 'Send Newsletter'}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                    {sendState.status !== 'idle' ? (
                      <p
                        className={cn(
                          'text-sm',
                          sendState.status === 'success'
                            ? 'text-emerald-700'
                            : 'text-[#E53E3E]'
                        )}
                      >
                        {sendState.message}
                      </p>
                    ) : null}
                    <input
                      ref={uploadJsonInputRef}
                      type="file"
                      accept=".json"
                      className="hidden"
                      onChange={handleUploadDesignFile}
                    />
                  </CardContent>
                </Card>
              </div>
          ) : null}
          {showPreview ? (
            <div className="fixed inset-0 z-50 bg-black/50 p-4 md:p-8 overflow-y-auto">
              <div className="mx-auto max-w-5xl rounded-lg bg-white p-4 shadow-xl">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant={previewViewport === 'desktop' ? 'default' : 'outline'}
                      onClick={() => setPreviewViewport('desktop')}
                    >
                      <Monitor className="mr-1 h-4 w-4" />
                      Desktop
                    </Button>
                    <Button
                      type="button"
                      variant={previewViewport === 'mobile' ? 'default' : 'outline'}
                      onClick={() => setPreviewViewport('mobile')}
                    >
                      <Smartphone className="mr-1 h-4 w-4" />
                      Mobile
                    </Button>
                  </div>
                  <Button type="button" variant="outline" onClick={() => setShowPreview(false)}>
                    <X className="mr-1 h-4 w-4" />
                    Close
                  </Button>
                </div>
                <div className="flex justify-center">
                  <div
                    className={cn(
                      'rounded-md border border-[var(--color-border)] bg-white shadow-sm',
                      previewViewport === 'desktop' ? 'w-[600px]' : 'w-[375px]'
                    )}
                  >
                    {renderPreview(subject, previewHtml)}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </section>
      </div>
      {toast ? (
        <div
          role="status"
          className={cn(
            'fixed bottom-6 right-6 z-[100] max-w-sm rounded-md border px-4 py-3 text-sm shadow-lg',
            toast.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : 'border-red-200 bg-red-50 text-[#991b1b]'
          )}
        >
          {toast.message}
        </div>
      ) : null}
    </main>
  );
}

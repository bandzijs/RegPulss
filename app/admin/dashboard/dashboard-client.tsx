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
  Send,
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
  | 'sent'
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
  { id: 'sent', label: 'Sent', icon: Send },
  { id: 'subscribers', label: 'Subscribers', icon: Users },
  { id: 'newsletter', label: 'Newsletter Editor', icon: Mail },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const NEWSLETTER_DESIGN_KEY = 'regpulss_email_design';
type PreviewViewport = 'desktop' | 'mobile';

const PRESET_STANDARD_HTML = `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;color:#1f2937;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="620" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
            <tr><td style="background:#E53E3E;color:#ffffff;padding:20px 24px;font-size:22px;font-weight:700;">RegPulss</td></tr>
            <tr><td style="padding:24px;font-size:15px;line-height:1.65;">
              <h2 style="margin:0 0 12px;font-size:20px;color:#111827;">Juridisko jaunumu apskats</h2>
              <p style="margin:0 0 12px;">Pievienojiet šeit galvenos tiesību aktu atjauninājumus un to ietekmi uz klientiem.</p>
              <p style="margin:0;">Šī ir RegPulss standarta vēstules veidne ar skaidru struktūru un sarkanu akcentu.</p>
            </td></tr>
            <tr><td style="padding:16px 24px;background:#f9fafb;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280;">
              Jūs saņemat šo vēstuli, jo esat abonējis RegPulss. <a href="{{unsubscribe_url}}" style="color:#E53E3E;">Atteikties</a>
            </td></tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

const PRESET_MINIMAL_HTML = `<!doctype html>
<html>
  <body style="margin:0;padding:24px;font-family:Arial,sans-serif;background:#ffffff;color:#111827;">
    <main style="max-width:640px;margin:0 auto;">
      <h2 style="margin:0 0 12px;font-size:22px;">RegPulss jaunumi</h2>
      <p style="margin:0 0 12px;line-height:1.65;">Šī ir minimāla vēstules veidne: bez smagas stilizācijas, tikai saturs un kājene.</p>
      <p style="margin:0;line-height:1.65;">Pievienojiet saturu šeit.</p>
      <hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb;" />
      <p style="font-size:12px;color:#6b7280;">Atteikšanās saite: <a href="{{unsubscribe_url}}" style="color:#111827;">{{unsubscribe_url}}</a></p>
    </main>
  </body>
</html>`;

const PRESET_PROFESSIONAL_HTML = `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#eef2f7;font-family:Arial,sans-serif;color:#111827;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #dbe3ee;">
            <tr><td style="background:#1f2937;color:#ffffff;padding:18px 24px;font-size:20px;font-weight:700;">RegPulss Legal Brief</td></tr>
            <tr><td style="padding:24px 28px;font-size:15px;line-height:1.7;">
              <h3 style="margin:0 0 12px;font-size:19px;color:#111827;">Nedēļas juridiskais kopsavilkums</h3>
              <p style="margin:0 0 12px;">Profesionāla veidne ar tumšu galveni un tīru satura zonu juridiskām ziņām.</p>
              <p style="margin:0;">Pievienojiet svarīgākos punktus, ietekmes analīzi un avotus.</p>
            </td></tr>
            <tr><td style="padding:14px 28px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b;">
              RegPulss • Profesionāls juridisko jaunumu serviss • <a href="{{unsubscribe_url}}" style="color:#1f2937;">Atteikties</a>
            </td></tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

const PRESET_STANDARD_DESIGN = {
  body: {
    rows: [
      {
        cells: [1],
        columns: [
          {
            contents: [
              {
                type: 'heading',
                values: { text: 'RegPulss', headingType: 'h1', color: '#E53E3E' },
              },
              {
                type: 'text',
                values: { text: 'Juridisko jaunumu apskats. Pievienojiet galvenos punktus šeit.' },
              },
            ],
          },
        ],
      },
    ],
  },
};

const PRESET_MINIMAL_DESIGN = {
  body: {
    rows: [
      {
        cells: [1],
        columns: [
          {
            contents: [
              { type: 'heading', values: { text: 'RegPulss jaunumi', headingType: 'h2' } },
              { type: 'text', values: { text: 'Minimāla veidne ar vienkāršu saturu un kājeni.' } },
            ],
          },
        ],
      },
    ],
  },
};

const PRESET_PROFESSIONAL_DESIGN = {
  body: {
    rows: [
      {
        cells: [1],
        columns: [
          {
            contents: [
              { type: 'heading', values: { text: 'RegPulss Legal Brief', headingType: 'h2', color: '#1f2937' } },
              { type: 'text', values: { text: 'Profesionāla juridiskā stila veidne ar strukturētu saturu.' } },
            ],
          },
        ],
      },
    ],
  },
};

type PresetKey = 'standard' | 'minimal' | 'professional';

function extractPlainTextFromHtml(html: string): string {
  if (!html.trim()) {
    return '';
  }
  const container = document.createElement('div');
  container.innerHTML = html;
  return (container.textContent || container.innerText || '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function splitDraftIntoSections(text: string): string[] {
  const normalized = text.trim();
  if (!normalized) {
    return [];
  }

  const doubleNewlineSplit = normalized
    .split(/\n\s*\n+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (doubleNewlineSplit.length > 1) {
    return doubleNewlineSplit;
  }

  const numberedSplit = normalized
    .split(/(?=\n?\d+\.\s+)/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (numberedSplit.length > 1) {
    return numberedSplit;
  }

  const bulletSplit = normalized
    .split(/(?=\n?[•\-]\s+)/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (bulletSplit.length > 1) {
    return bulletSplit;
  }

  return [normalized];
}

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

function hasBotDraftContent(json: unknown): boolean {
  if (json == null) {
    return true;
  }
  if (typeof json !== 'object' || Array.isArray(json)) {
    return true;
  }
  return Object.keys(json as Record<string, unknown>).length === 0;
}

function normalizeStatus(status: string | null | undefined): string {
  return (status ?? '').trim().toLowerCase();
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
  const [previewSourceDraft, setPreviewSourceDraft] = useState<NewsletterDraft | null>(
    null
  );
  const [previewViewport, setPreviewViewport] = useState<PreviewViewport>('desktop');
  const [editorHtml, setEditorHtml] = useState('');
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
  const isDesignSaved = false;
  const [showPasteInfoBanner, setShowPasteInfoBanner] = useState(false);
  const [editorInfoBanner, setEditorInfoBanner] = useState<string | null>(null);
  const [referencePanelSections, setReferencePanelSections] = useState<string[]>([]);
  const [isReferencePanelOpen, setIsReferencePanelOpen] = useState(true);
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [sendState, setSendState] = useState<{
    status: 'idle' | 'loading' | 'success' | 'error';
    message: string;
  }>({ status: 'idle', message: '' });
  const uploadHtmlInputRef = useRef<HTMLInputElement | null>(null);

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
      const pending = payload.drafts.filter(
        (d) => normalizeStatus(d.status) === 'draft'
      ).length;
      setPendingDraftsCount(pending);
      router.refresh();
    } catch {
      // ignore
    }
  }

  const loadDraftsList = useCallback(async () => {
    setDraftsLoading(true);
    setDraftsError(null);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const res = await fetch('/api/drafts', {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const data = (await res.json()) as unknown;
      console.log('drafts loaded:', data);

      if (!res.ok) {
        const apiError =
          typeof data === 'object' &&
          data !== null &&
          'error' in data &&
          typeof (data as { error?: unknown }).error === 'string'
            ? (data as { error: string }).error
            : 'Failed to load drafts';
        setDraftsError(apiError);
        setDrafts([]);
        return;
      }

      const normalized = (
        (typeof data === 'object' &&
        data !== null &&
        'drafts' in data &&
        Array.isArray((data as { drafts?: unknown }).drafts)
          ? (data as { drafts: NewsletterDraft[] }).drafts
          : Array.isArray(data)
            ? (data as NewsletterDraft[])
            : []) ?? []
      ) as NewsletterDraft[];

      setDrafts(normalized);
    } catch (e) {
      clearTimeout(timeout);
      console.error('fetchDrafts error:', e);
      setDrafts([]);
      if (e instanceof DOMException && e.name === 'AbortError') {
        setDraftsError('Loading took too long — please refresh');
      } else {
        setDraftsError('Failed to load drafts');
      }
    } finally {
      clearTimeout(timeout);
      setDraftsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (
      activeSection === 'drafts' ||
      activeSection === 'archive' ||
      activeSection === 'sent'
    ) {
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
    () => drafts.filter((entry) => normalizeStatus(entry.status) === 'draft'),
    [drafts]
  );
  const archivedItems = useMemo(
    () => drafts.filter((entry) => normalizeStatus(entry.status) === 'archived'),
    [drafts]
  );
  const sentItems = useMemo(
    () => drafts.filter((entry) => normalizeStatus(entry.status) === 'sent'),
    [drafts]
  );

  const growthData = useMemo(
    () => createGrowthSeries(subscribers),
    [subscribers]
  );
  const trend = useMemo(() => getTrend(growthData), [growthData]);
  const emailBodyStats = useMemo(() => {
    const source = editorHtml || previewHtml;
    const text = source
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const characters = text.length;
    const words = text ? text.split(' ').length : 0;
    return { words, characters };
  }, [editorHtml, previewHtml]);

  async function handlePreviewNewsletter() {
    if (!subject.trim()) {
      setSendState({
        status: 'error',
        message: 'Subject is required.',
      });
      return;
    }

    const html = editorHtml.trim();
    if (!html) {
      setSendState({
        status: 'error',
        message: 'Please add HTML content before previewing.',
      });
      return;
    }
    setPreviewHtml(html);
    setShowPreview(true);
    setPreviewSourceDraft(null);
    setSendState({ status: 'idle', message: '' });
  }

  async function handleSaveDesign() {
    const html = editorHtml.trim();
    if (!html) {
      setSendState({
        status: 'error',
        message: 'Editor HTML is empty.',
      });
      return;
    }
    window.localStorage.setItem(NEWSLETTER_DESIGN_KEY, html);
    setSendState({
      status: 'success',
      message: 'Design saved locally.',
    });
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

      setEditorHtml(raw);
      setPreviewHtml(raw);
      setSendState({
        status: 'success',
        message: 'Saved HTML design loaded.',
      });
    } catch (error) {
      console.error('Load design failed:', error);
      setSendState({
        status: 'error',
        message: 'Failed to load saved design.',
      });
    }
  }

  function handleUploadDesignClick() {
    uploadHtmlInputRef.current?.click();
  }

  async function handleDownloadDesign() {
    const html = editorHtml.trim();
    if (!html) {
      setSendState({
        status: 'error',
        message: 'Editor HTML is empty.',
      });
      return;
    }
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'regpulss-email-design.html';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setSendState({
      status: 'success',
      message: 'Design HTML downloaded.',
    });
  }

  async function handleUploadDesignFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const content = await file.text();
      setEditorHtml(content);
      setPreviewHtml(content);
      window.localStorage.setItem(NEWSLETTER_DESIGN_KEY, content);
      setSendState({
        status: 'success',
        message: 'HTML design uploaded successfully.',
      });
    } catch (error) {
      console.error('Upload design failed:', error);
      setSendState({
        status: 'error',
        message: 'Invalid HTML file. Could not load design.',
      });
    } finally {
      event.target.value = '';
    }
  }

  function getPresetByKey(key: PresetKey): {
    html: string;
    design: object;
    title: string;
  } {
    if (key === 'minimal') {
      return {
        html: PRESET_MINIMAL_HTML,
        design: PRESET_MINIMAL_DESIGN as object,
        title: 'Minimal',
      };
    }
    if (key === 'professional') {
      return {
        html: PRESET_PROFESSIONAL_HTML,
        design: PRESET_PROFESSIONAL_DESIGN as object,
        title: 'Professional',
      };
    }
    return {
      html: PRESET_STANDARD_HTML,
      design: PRESET_STANDARD_DESIGN as object,
      title: 'RegPulss Standard',
    };
  }

  function handleOpenPresetModal() {
    setIsPresetModalOpen(true);
  }

  function handleApplyPreset(key: PresetKey) {
    const preset = getPresetByKey(key);
    setEditorHtml(preset.html);
    setPreviewHtml(preset.html);
    setIsPresetModalOpen(false);
    showToast(setToast, `${preset.title} preset applied.`, 'success');
  }

  async function copyTextToClipboard(text: string, successMessage: string) {
    try {
      await navigator.clipboard.writeText(text);
      showToast(setToast, successMessage, 'success');
    } catch (error) {
      console.error(error);
      showToast(setToast, 'Failed to copy content.', 'error');
    }
  }

  async function handleCopyDraftContent(draft: NewsletterDraft) {
    const plain = extractPlainTextFromHtml(draft.html_content ?? '');
    if (!plain) {
      showToast(setToast, 'No content to copy.', 'error');
      return;
    }
    await copyTextToClipboard(
      plain,
      'Content copied! Paste it into the Newsletter Editor'
    );
  }

  function handleOpenDraftInEditor(draft: NewsletterDraft) {
    const plain = extractPlainTextFromHtml(draft.html_content ?? '');
    setSubject(draft.subject ?? '');
    setEditingDraftId(draft.id);
    setEditorHtml(PRESET_STANDARD_HTML);
    setShowPasteInfoBanner(true);
    setEditorInfoBanner('Paste your copied content into the blocks below');
    setReferencePanelSections(splitDraftIntoSections(plain));
    setIsReferencePanelOpen(true);
    setActiveSection('newsletter');
  }

  function handleEditDraft(draft: NewsletterDraft) {
    setSubject(draft.subject ?? '');
    setEditingDraftId(draft.id);
    setIsFullscreenEditor(false);
    setShowPasteInfoBanner(false);
    setEditorInfoBanner(null);
    setReferencePanelSections([]);
    const html = draft.html_content?.trim()
      ? draft.html_content
      : PRESET_STANDARD_HTML;
    setEditorHtml(html ?? PRESET_STANDARD_HTML);
    setPreviewHtml(html ?? '');
    setActiveSection('newsletter');
  }

  async function handleSaveAsDraft() {
    const html = editorHtml;

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
        setEditorHtml('');
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
        setEditorHtml('');
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
      setPreviewSourceDraft(payload.draft);
      setShowPreview(true);
      setSendState({ status: 'idle', message: '' });
    } catch (error) {
      console.error(error);
      showToast(setToast, 'Failed to load draft preview.', 'error');
    } finally {
      setDraftPreviewLoadingId(null);
    }
  }

  function handleEditPreviewInEditor() {
    if (!previewSourceDraft) {
      showToast(setToast, 'No draft loaded in preview.', 'error');
      return;
    }

    const html = (previewSourceDraft.html_content ?? '').trim();
    if (!html) {
      showToast(setToast, 'Draft is missing HTML content.', 'error');
      return;
    }

    setShowPreview(false);
    setPreviewSourceDraft(null);
    setShowPasteInfoBanner(false);
    setEditorInfoBanner('Editing AI draft in HTML editor');
    setReferencePanelSections([]);
    setSubject(previewSourceDraft.subject ?? '');
    setEditingDraftId(previewSourceDraft.id);
    setEditorHtml(html);
    setPreviewHtml(html);
    setActiveSection('newsletter');
  }

  async function handleSendNewsletter() {
    if (!subject.trim()) {
      setSendState({
        status: 'error',
        message: 'Subject is required.',
      });
      return;
    }

    const html = editorHtml;

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
                ) : id === 'sent' && sentItems.length > 0 ? (
                  <Badge className="shrink-0 border-0 bg-emerald-500 text-white hover:bg-emerald-500">
                    {sentItems.length}
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
                        const isBotDraft = hasBotDraftContent(draft.json_content);
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
                                {isBotDraft ? (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="text-xs h-8"
                                    disabled={busy}
                                    onClick={() => void handleCopyDraftContent(draft)}
                                  >
                                    Copy Content
                                  </Button>
                                ) : null}
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
                                {isBotDraft ? (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="text-xs h-8"
                                    disabled={busy}
                                    onClick={() => handleOpenDraftInEditor(draft)}
                                  >
                                    Open in Editor
                                  </Button>
                                ) : null}
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

          {activeSection === 'sent' ? (
            <div className="mt-4 space-y-4">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>Sent</CardTitle>
                  <CardDescription>Previously sent newsletters.</CardDescription>
                </CardHeader>
                <CardContent>
                  {draftsLoading ? (
                    <p className="text-sm text-muted-foreground">Loading sent newsletters…</p>
                  ) : draftsError ? (
                    <p className="text-sm text-[#E53E3E]">{draftsError}</p>
                  ) : sentItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No sent newsletters yet.
                    </p>
                  ) : (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Subject</TableHead>
                            <TableHead>Sent Date</TableHead>
                            <TableHead>Sources count</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sentItems.map((draft) => {
                            const busy = draftActionId === draft.id;
                            return (
                              <TableRow key={draft.id}>
                                <TableCell className="font-medium">
                                  {draft.title || 'Untitled'}
                                </TableCell>
                                <TableCell>{draft.subject || '(No subject)'}</TableCell>
                                <TableCell className="text-muted-foreground">
                                  {draft.sent_at ? formatDate(draft.sent_at) : '—'}
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
                                      onClick={() => void handleArchiveDraft(draft)}
                                    >
                                      Archive
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
                      {!editingDraftId ? (
                        <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                          <p className="font-medium">Start from scratch or load a draft from the Drafts section.</p>
                          <p className="mt-1 text-xs text-slate-600">
                            Tip: Use &quot;Open in Editor&quot; on an AI draft to get started quickly.
                          </p>
                        </div>
                      ) : null}

                      {showPasteInfoBanner || editorInfoBanner ? (
                        <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                          {editorInfoBanner ??
                            'Paste your copied content into the blocks below'}
                        </div>
                      ) : null}

                      {referencePanelSections.length > 0 ? (
                        <div className="rounded-md border border-slate-200 bg-slate-50">
                          <div className="flex items-center justify-between gap-2 px-4 py-3">
                            <p className="text-sm font-medium">
                              📋 AI Draft Content — copy sections below into the editor
                            </p>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setIsReferencePanelOpen((value) => !value)
                              }
                            >
                              {isReferencePanelOpen ? 'Hide' : 'Show'}
                            </Button>
                          </div>
                          {isReferencePanelOpen ? (
                            <div className="space-y-2 border-t border-slate-200 px-4 py-3">
                              {referencePanelSections.map((section, index) => (
                                <div
                                  key={`reference-section-${index}`}
                                  className="rounded-md border bg-white p-3"
                                >
                                  <div className="mb-2 flex items-center justify-between gap-2">
                                    <p className="text-xs font-medium text-muted-foreground">
                                      Section {index + 1}
                                    </p>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        void copyTextToClipboard(
                                          section,
                                          'Section copied to clipboard.'
                                        )
                                      }
                                    >
                                      Copy
                                    </Button>
                                  </div>
                                  <p className="whitespace-pre-wrap text-xs leading-relaxed">
                                    {section}
                                  </p>
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      ) : null}

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
                                disabled={sendState.status === 'loading'}
                              >
                                Preview
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={handleSaveDesign}
                                disabled={sendState.status === 'loading'}
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
                                      disabled={sendState.status === 'loading'}
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
                                      disabled={sendState.status === 'loading'}
                                    >
                                      Upload Design
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={handleUploadDesignClick}
                                      disabled={sendState.status === 'loading'}
                                    >
                                      Upload JSON
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={handleOpenPresetModal}
                                      disabled={sendState.status === 'loading'}
                                    >
                                      Apply Preset
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={handleDownloadDesign}
                                      disabled={sendState.status === 'loading'}
                                    >
                                      Download JSON
                                    </Button>
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
                              ) : null}
                              <div className="grid gap-4 lg:grid-cols-2">
                                <textarea
                                  id="newsletter-editor"
                                  className="w-full rounded-md border border-input bg-background p-3 font-mono text-sm leading-relaxed"
                                  style={{ height: '700px' }}
                                  value={editorHtml}
                                  onChange={(event) => {
                                    const value = event.target.value;
                                    setEditorHtml(value);
                                    setPreviewHtml(value);
                                  }}
                                  spellCheck={false}
                                />
                                <iframe
                                  title="Live HTML preview"
                                  className="w-full rounded-md border border-[var(--color-border)] bg-white"
                                  style={{ height: '700px' }}
                                  srcDoc={editorHtml}
                                />
                              </div>
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
                                  disabled={sendState.status === 'loading'}
                                >
                                  Upload Design
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={handleUploadDesignClick}
                                  disabled={sendState.status === 'loading'}
                                >
                                  Upload JSON
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={handleOpenPresetModal}
                                  disabled={sendState.status === 'loading'}
                                >
                                  Apply Preset
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={handleDownloadDesign}
                                  disabled={sendState.status === 'loading'}
                                >
                                  Download JSON
                                </Button>
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
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
                          </div>
                      </>
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
                      ref={uploadHtmlInputRef}
                      type="file"
                      accept=".html,.htm,text/html"
                      className="hidden"
                      onChange={handleUploadDesignFile}
                    />
                  </CardContent>
                </Card>
              </div>
          ) : null}
          {isPresetModalOpen ? (
            <div className="fixed inset-0 z-50 bg-black/50 p-4 md:p-8 overflow-y-auto">
              <div className="mx-auto max-w-3xl rounded-lg bg-white p-4 shadow-xl md:p-6">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-semibold">Apply Preset</h3>
                    <p className="text-sm text-muted-foreground">
                      Choose a template preset for your newsletter.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsPresetModalOpen(false)}
                  >
                    <X className="mr-1 h-4 w-4" />
                    Close
                  </Button>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <Card className="border shadow-sm">
                    <CardHeader className="p-3 pb-2">
                      <CardTitle className="text-sm">RegPulss Standard</CardTitle>
                      <CardDescription className="text-xs">
                        Clean RegPulss branded template, red accent, footer with unsubscribe link.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 space-y-3">
                      <div className="h-24 rounded border bg-gradient-to-b from-red-50 to-white p-2 text-[10px] text-muted-foreground">
                        Red branded header, structured content, clean footer.
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        className="w-full"
                        onClick={() => handleApplyPreset('standard')}
                      >
                        Use this template
                      </Button>
                    </CardContent>
                  </Card>
                  <Card className="border shadow-sm">
                    <CardHeader className="p-3 pb-2">
                      <CardTitle className="text-sm">Minimal</CardTitle>
                      <CardDescription className="text-xs">
                        Plain white email with content and footer, minimal styling.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 space-y-3">
                      <div className="h-24 rounded border bg-white p-2 text-[10px] text-muted-foreground">
                        Lightweight layout focused on text readability.
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        className="w-full"
                        onClick={() => handleApplyPreset('minimal')}
                      >
                        Use this template
                      </Button>
                    </CardContent>
                  </Card>
                  <Card className="border shadow-sm">
                    <CardHeader className="p-3 pb-2">
                      <CardTitle className="text-sm">Professional</CardTitle>
                      <CardDescription className="text-xs">
                        Dark header with legal newsletter style and white content area.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 space-y-3">
                      <div className="h-24 rounded border bg-gradient-to-b from-slate-900 to-white p-2 text-[10px] text-muted-foreground">
                        Professional legal-brief look with clear hierarchy.
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        className="w-full"
                        onClick={() => handleApplyPreset('professional')}
                      >
                        Use this template
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
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
                    {previewSourceDraft &&
                    hasBotDraftContent(previewSourceDraft.json_content) ? (
                      <Button
                        type="button"
                        variant="default"
                        className="bg-[#E53E3E] text-white hover:bg-[#c53030]"
                        onClick={handleEditPreviewInEditor}
                      >
                        Edit in Editor
                      </Button>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowPreview(false);
                      setPreviewSourceDraft(null);
                    }}
                  >
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

'use client';

import { useMemo, useRef, useState } from 'react';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  BarChart3,
  Bolt,
  Expand,
  Mail,
  Monitor,
  Settings,
  Smartphone,
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
import { Tabs, TabsContent } from '@/components/ui/tabs';
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

interface DashboardClientProps {
  userEmail: string;
  subscribers: Subscriber[];
  loadError?: string;
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

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'subscribers', label: 'Subscribers', icon: Users },
  { id: 'newsletter', label: 'Send Newsletter', icon: Mail },
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

export default function DashboardClient({
  userEmail,
  subscribers,
  loadError,
}: DashboardClientProps) {
  const [activeTab, setActiveTab] = useState<'subscribers' | 'newsletter'>(
    'subscribers'
  );
  const [query, setQuery] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [previewHtml, setPreviewHtml] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [previewViewport, setPreviewViewport] = useState<PreviewViewport>('desktop');
  const [editorReady, setEditorReady] = useState(false);
  const [initialDesign] = useState<object | undefined>(undefined);
  const [isFullscreenEditor, setIsFullscreenEditor] = useState(false);
  const [isDesignSaved, setIsDesignSaved] = useState(false);
  const [sendState, setSendState] = useState<{
    status: 'idle' | 'loading' | 'success' | 'error';
    message: string;
  }>({ status: 'idle', message: '' });
  const emailEditorRef = useRef<EmailEditorHandle | null>(null);
  const uploadJsonInputRef = useRef<HTMLInputElement | null>(null);

  const filteredSubscribers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return subscribers;
    }
    return subscribers.filter((entry) =>
      entry.email.toLowerCase().includes(normalized)
    );
  }, [query, subscribers]);

  const growthData = useMemo(
    () => createGrowthSeries(subscribers),
    [subscribers]
  );
  const trend = useMemo(() => getTrend(growthData), [growthData]);
  const emailBodyStats = useMemo(() => {
    const text = previewHtml
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const characters = text.length;
    const words = text ? text.split(' ').length : 0;
    return { words, characters };
  }, [previewHtml]);

  async function handlePreviewNewsletter() {
    if (!subject.trim()) {
      setSendState({
        status: 'error',
        message: 'Subject is required.',
      });
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

  async function handleUploadDesignFile(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
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

  async function handleSendNewsletter() {
    if (!subject.trim()) {
      setSendState({
        status: 'error',
        message: 'Subject is required.',
      });
      return;
    }

    let html = '';
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

    if (!html.trim()) {
      setSendState({
        status: 'error',
        message: 'Email content is empty.',
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
          body: body.trim(),
          html,
        }),
      });

      const payload = (await response.json()) as
        | { success: true; message: string }
        | { success: false; error: string };

      if (!response.ok || !payload.success) {
        setSendState({
          status: 'error',
          message:
            'error' in payload
              ? payload.error
              : 'Failed to send newsletter.',
        });
        return;
      }

      setSendState({ status: 'success', message: payload.message });
      setPreviewHtml(html);
    } catch (error) {
      console.error('Newsletter send failed:', error);
      setSendState({
        status: 'error',
        message: 'Unexpected error while sending newsletter.',
      });
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
                  'w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                  id === 'settings'
                    ? 'text-gray-500 cursor-not-allowed'
                    : 'text-gray-200 hover:bg-gray-900'
                )}
                disabled={id === 'settings'}
                onClick={() => {
                  if (id === 'subscribers') setActiveTab('subscribers');
                  if (id === 'newsletter') setActiveTab('newsletter');
                }}
              >
                <Icon className="h-4 w-4" />
                {label}
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
              <CardContent className="h-64">
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

          <Tabs
            value={activeTab}
            onValueChange={(value) =>
              setActiveTab(value as 'subscribers' | 'newsletter')
            }
          >
            <TabsContent value="subscribers" className="mt-4">
              <Card className="shadow-sm">
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
            </TabsContent>

            <TabsContent value="newsletter" className="mt-4">
              <div className="grid gap-6 xl:grid-cols-2">
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle>Send Newsletter</CardTitle>
                    <CardDescription>
                      Draft and send a bulk message to all subscribers.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label
                        htmlFor="newsletter-subject"
                        className="text-sm text-muted-foreground"
                      >
                        Subject line
                      </label>
                      <Input
                        id="newsletter-subject"
                        value={subject}
                        onChange={(event) => setSubject(event.target.value)}
                        placeholder="Weekly RegPulss updates"
                      />
                    </div>
                    <div className="space-y-2">
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
                            onClick={() => setIsFullscreenEditor((value) => !value)}
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
                            disabled={!editorReady || sendState.status === 'loading'}
                          >
                            Preview
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleSaveDesign}
                            disabled={!editorReady || sendState.status === 'loading'}
                          >
                            Save Design
                            <span
                              className={cn(
                                'ml-2 h-2 w-2 rounded-full',
                                isDesignSaved ? 'bg-emerald-500' : 'bg-gray-400'
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
                        <div className={cn(isFullscreenEditor ? 'max-w-6xl mx-auto' : '')}>
                          {isFullscreenEditor ? (
                            <div className="space-y-4 mb-4">
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
                                value={subject}
                                onChange={(event) => setSubject(event.target.value)}
                                placeholder="Weekly RegPulss updates"
                              />
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={handleSaveDesign}
                                  disabled={!editorReady || sendState.status === 'loading'}
                                >
                                  Save Design
                                  <span
                                    className={cn(
                                      'ml-2 h-2 w-2 rounded-full',
                                      isDesignSaved ? 'bg-emerald-500' : 'bg-gray-400'
                                    )}
                                  />
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                            onClick={handleUploadDesignFromStorage}
                                  disabled={!editorReady || sendState.status === 'loading'}
                                >
                            Upload Design
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleUploadDesignClick}
                            disabled={!editorReady || sendState.status === 'loading'}
                          >
                            Upload JSON
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleDownloadDesign}
                            disabled={!editorReady || sendState.status === 'loading'}
                          >
                            Download JSON
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={handlePreviewNewsletter}
                                  disabled={!editorReady || sendState.status === 'loading'}
                                >
                                  Preview
                                </Button>
                                <Button
                                  type="button"
                                  onClick={handleSendNewsletter}
                                  disabled={!editorReady || sendState.status === 'loading'}
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
                            ref={emailEditorRef}
                            onReady={() => setEditorReady(true)}
                            onExportHtml={(html) => {
                              setPreviewHtml(html);
                              setBody(html);
                              setIsDesignSaved(false);
                            }}
                            initialDesign={initialDesign}
                            minHeight={isFullscreenEditor ? 'calc(100vh - 120px)' : 700}
                          />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {emailBodyStats.words} words • {emailBodyStats.characters} characters
                      </p>
                    </div>
                    <div className="border-t border-[var(--color-border)] pt-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-3">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleUploadDesignFromStorage}
                            disabled={!editorReady || sendState.status === 'loading'}
                          >
                            Upload Design
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleUploadDesignClick}
                            disabled={!editorReady || sendState.status === 'loading'}
                          >
                            Upload JSON
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleDownloadDesign}
                            disabled={!editorReady || sendState.status === 'loading'}
                          >
                            Download JSON
                          </Button>
                        </div>
                        <Button
                          type="button"
                          onClick={handleSendNewsletter}
                          disabled={!editorReady || sendState.status === 'loading'}
                          className="bg-[#E53E3E] text-white hover:bg-[#c53030]"
                        >
                          {sendState.status === 'loading' ? 'Sending...' : 'Send Newsletter'}
                        </Button>
                      </div>
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

                <div>
                  <Card className="shadow-sm">
                    <CardHeader>
                      <CardTitle>Email Preview</CardTitle>
                      <CardDescription>
                        Click Preview to open modal preview.
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
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
    </main>
  );
}

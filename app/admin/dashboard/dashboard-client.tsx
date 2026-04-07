'use client';

import { useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import AdminLogoutButton from './logout-button';

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

function renderPreview(subject: string, body: string) {
  return (
    <article className="rounded-lg border border-[var(--color-border)] bg-white p-5">
      <p className="text-xs uppercase tracking-wide text-[var(--color-text-secondary)] mb-2">
        Newsletter Preview
      </p>
      <h3 className="font-[family-name:var(--font-serif)] text-2xl text-[var(--color-text-primary)] mb-4">
        {subject || '(No subject)'}
      </h3>
      <div className="text-sm leading-7 text-[var(--color-text-primary)] whitespace-pre-wrap">
        {body || '(No content)'}
      </div>
    </article>
  );
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
  const [showPreview, setShowPreview] = useState(false);
  const [sendState, setSendState] = useState<{
    status: 'idle' | 'loading' | 'success' | 'error';
    message: string;
  }>({ status: 'idle', message: '' });

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

  async function handleSendNewsletter() {
    if (!subject.trim() || !body.trim()) {
      setSendState({
        status: 'error',
        message: 'Subject and content are required.',
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
    } catch (error) {
      console.error('Newsletter send failed:', error);
      setSendState({
        status: 'error',
        message: 'Unexpected error while sending newsletter.',
      });
    }
  }

  return (
    <main className="min-h-screen bg-[var(--color-background)]">
      <header className="border-b border-[var(--color-border)] bg-[var(--color-background)]">
        <div className="container py-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="w-9 h-9 rounded-md bg-[var(--color-text-primary)] text-white grid place-items-center font-bold">
              R
            </div>
            <div>
              <p className="font-semibold text-[var(--color-text-primary)]">
                RegPulss Admin
              </p>
              <h1 className="font-[family-name:var(--font-serif)] text-2xl text-[var(--color-text-primary)]">
                Dashboard
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-sm text-[var(--color-text-secondary)]">
              {userEmail}
            </p>
            <AdminLogoutButton className="cta-button !w-auto px-4 py-2 text-sm" />
          </div>
        </div>
      </header>

      <div className="container py-8 md:py-10 space-y-8">
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <article className="rounded-lg border border-[var(--color-border)] bg-[var(--color-background-alt)] p-5">
            <p className="text-sm text-[var(--color-text-secondary)] mb-2">
              Total Subscribers
            </p>
            <p className="text-3xl font-semibold text-[var(--color-text-primary)]">
              {subscribers.length}
            </p>
          </article>
          <article className="rounded-lg border border-[var(--color-border)] bg-[var(--color-background-alt)] p-5 md:col-span-2">
            <p className="text-sm text-[var(--color-text-secondary)] mb-3">
              Subscriber Growth
            </p>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={growthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#666666' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#666666' }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#DC2626"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </article>
        </section>

        {loadError ? (
          <p className="text-sm" style={{ color: 'var(--color-accent)' }}>
            {loadError}
          </p>
        ) : null}

        <section className="flex gap-2 border-b border-[var(--color-border)]">
          <button
            type="button"
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === 'subscribers'
                ? 'text-[var(--color-text-primary)] border-b-2 border-[var(--color-accent)]'
                : 'text-[var(--color-text-secondary)]'
            }`}
            onClick={() => setActiveTab('subscribers')}
          >
            Subscribers
          </button>
          <button
            type="button"
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === 'newsletter'
                ? 'text-[var(--color-text-primary)] border-b-2 border-[var(--color-accent)]'
                : 'text-[var(--color-text-secondary)]'
            }`}
            onClick={() => setActiveTab('newsletter')}
          >
            Send Newsletter
          </button>
        </section>

        {activeTab === 'subscribers' ? (
          <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-background)]">
            <div className="p-5 border-b border-[var(--color-border)]">
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by email"
                className="email-input !mb-0"
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--color-background-alt)] text-left">
                    <th className="px-4 py-3 font-medium text-[var(--color-text-secondary)]">
                      #
                    </th>
                    <th className="px-4 py-3 font-medium text-[var(--color-text-secondary)]">
                      Email
                    </th>
                    <th className="px-4 py-3 font-medium text-[var(--color-text-secondary)]">
                      Date Subscribed
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubscribers.map((entry, index) => (
                    <tr
                      key={entry.id}
                      className="border-t border-[var(--color-border)]"
                    >
                      <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3 text-[var(--color-text-primary)]">
                        {entry.email}
                      </td>
                      <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                        {formatDate(entry.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredSubscribers.length === 0 ? (
                <p className="p-5 text-sm text-[var(--color-text-secondary)]">
                  No subscribers found.
                </p>
              ) : null}
            </div>
          </section>
        ) : (
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-background-alt)] p-5">
              <label
                htmlFor="newsletter-subject"
                className="block text-sm text-[var(--color-text-secondary)] mb-2"
              >
                Subject line
              </label>
              <input
                id="newsletter-subject"
                type="text"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                className="email-input"
                placeholder="Weekly RegPulss updates"
              />

              <label
                htmlFor="newsletter-body"
                className="block text-sm text-[var(--color-text-secondary)] mb-2"
              >
                Email body
              </label>
              <textarea
                id="newsletter-body"
                value={body}
                onChange={(event) => setBody(event.target.value)}
                className="email-input min-h-48 resize-y"
                placeholder="Write your newsletter..."
              />

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className="cta-button !w-auto px-4 py-2"
                  onClick={() => setShowPreview((value) => !value)}
                >
                  {showPreview ? 'Hide Preview' : 'Preview'}
                </button>
                <button
                  type="button"
                  className="cta-button !w-auto px-4 py-2 bg-[var(--color-accent)] hover:bg-[#b91c1c]"
                  onClick={handleSendNewsletter}
                  disabled={sendState.status === 'loading'}
                >
                  {sendState.status === 'loading' ? 'Sending...' : 'Send'}
                </button>
              </div>

              {sendState.status !== 'idle' ? (
                <p
                  className="text-sm mt-4"
                  style={{
                    color:
                      sendState.status === 'success'
                        ? 'var(--color-text-primary)'
                        : 'var(--color-accent)',
                  }}
                >
                  {sendState.message}
                </p>
              ) : null}
            </div>

            <div>
              {showPreview ? (
                renderPreview(subject, body)
              ) : (
                <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] p-5 text-sm text-[var(--color-text-secondary)]">
                  Preview is hidden. Click <strong>Preview</strong> to render
                  the newsletter.
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

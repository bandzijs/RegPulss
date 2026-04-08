'use client';

import { useEffect, useState } from 'react';
import { Check, CircleSlash, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LikumiStats {
  date: string;
  published: number;
  effective: number;
  expired: number;
}

export default function LikumiStatsWidget() {
  const [data, setData] = useState<LikumiStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/likumi-stats');
        const payload = (await res.json()) as LikumiStats | { error: string };
        if (cancelled) {
          return;
        }
        if (!res.ok || 'error' in payload) {
          setError(true);
          setData(null);
        } else {
          setData(payload);
          setError(false);
        }
      } catch {
        if (!cancelled) {
          setError(true);
          setData(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="newsletter-preview relative">
      <div
        className={cn(
          'absolute right-3 top-3 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wide text-emerald-800'
        )}
      >
        Live
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4 pr-14">
          <div className="h-4 w-3/4 rounded bg-muted" />
          <div className="h-3 w-24 rounded bg-muted" />
          <div className="h-px w-full bg-[var(--color-border)]" />
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 rounded-full bg-muted" />
              <div className="h-4 flex-1 rounded bg-muted" />
            </div>
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 rounded-full bg-muted" />
              <div className="h-4 flex-1 rounded bg-muted" />
            </div>
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 rounded-full bg-muted" />
              <div className="h-4 flex-1 rounded bg-muted" />
            </div>
          </div>
          <div className="h-px w-full bg-[var(--color-border)]" />
          <div className="h-8 w-full rounded bg-muted" />
        </div>
      ) : error || !data ? (
        <p className="pr-14 text-center text-sm text-muted-foreground">Nav datu</p>
      ) : (
        <>
          <div className="preview-header">
            <span className="preview-title leading-tight">
              Šodienas jaunumi tiesību aktos
            </span>
          </div>
          <div className="preview-date font-medium">{data.date}</div>
          <div className="my-3 h-px w-full bg-[var(--color-border)]" />
          <ul className="flex flex-col gap-3 text-[0.9375rem]">
            <li className="flex items-center gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <Plus className="h-3.5 w-3.5 stroke-[2.5]" aria-hidden />
              </span>
              <span className="tabular-nums font-semibold text-[var(--color-text-primary)]">
                {data.published}
              </span>
              <span className="text-[var(--color-text-secondary)]">publicēti</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <Check className="h-3.5 w-3.5 stroke-[2.5]" aria-hidden />
              </span>
              <span className="tabular-nums font-semibold text-[var(--color-text-primary)]">
                {data.effective}
              </span>
              <span className="text-[var(--color-text-secondary)]">stājas spēkā</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-700">
                <CircleSlash className="h-3.5 w-3.5 stroke-[2.5]" aria-hidden />
              </span>
              <span className="tabular-nums font-semibold text-[var(--color-text-primary)]">
                {data.expired}
              </span>
              <span className="text-[var(--color-text-secondary)]">zaudē spēku</span>
            </li>
          </ul>
          <div className="my-3 h-px w-full bg-[var(--color-border)]" />
          <a
            href="https://likumi.lv"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm font-medium text-[var(--color-text-primary)] shadow-sm transition-colors hover:bg-muted/50"
          >
            Skatīt likumi.lv →
          </a>
        </>
      )}
    </div>
  );
}

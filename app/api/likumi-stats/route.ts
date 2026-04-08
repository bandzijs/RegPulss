import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import * as cheerio from 'cheerio';

export const revalidate = 3600;

export interface LikumiStatsPayload {
  date: string;
  published: number;
  effective: number;
  expired: number;
}

async function scrapeLikumiStats(): Promise<LikumiStatsPayload> {
  const res = await fetch('https://likumi.lv', {
    headers: {
      'User-Agent':
        'RegPulss/1.0 (+https://regpulss.lv) likumi-stats-widget',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  });

  if (!res.ok) {
    throw new Error(`likumi.lv HTTP ${res.status}`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);

  const block = $('.listStyle2').first();
  if (!block.length) {
    throw new Error('Šodienas jaunumi block not found');
  }

  const date = block.find('.date').first().text().trim();
  const numbers: number[] = [];

  block.find('table tr').each((_, tr) => {
    const cell = $(tr).find('td.tac a').first();
    const txt = cell.text().trim();
    const n = parseInt(txt, 10);
    if (!Number.isNaN(n)) {
      numbers.push(n);
    }
  });

  if (!date || numbers.length < 3) {
    throw new Error('Could not parse likumi.lv stats');
  }

  return {
    date,
    published: numbers[0],
    effective: numbers[1],
    expired: numbers[2],
  };
}

const getCachedLikumiStats = unstable_cache(
  async () => scrapeLikumiStats(),
  ['likumi-home-stats'],
  { revalidate: 3600 }
);

export async function GET() {
  try {
    const data = await getCachedLikumiStats();
    return NextResponse.json(data);
  } catch (error) {
    console.error('likumi-stats scrape error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 502 }
    );
  }
}

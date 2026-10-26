import type { Memory } from '../types';
import { formatDate, formatMonth, num, parse, span, toStr, todayStr } from './format';
import { sortMemories } from './layout';

export interface Page {
  key: string;
  /** zero-based month of life, or null when no birth date is known */
  index: number | null;
  title: string;
  subtitle: string;
  /** first day covered by the page (YYYY-MM-DD) */
  start: string;
  items: Memory[];
}

const ORD = ['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس', 'السابع', 'الثامن', 'التاسع', 'العاشر', 'الحادي عشر', 'الثاني عشر'];

export function addMonths(s: string, n: number): string {
  const d = parse(s);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + n);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, last));
  return toStr(d);
}

const monthsBetween = (a: string, b: string) => {
  const { y, m } = span(a, b);
  return y * 12 + m;
};

/** Pages run from the day of birth to today, one per month of life. Without a birth date they follow the calendar. */
export function buildPages(all: Memory[], birth: string | null): Page[] {
  const sorted = sortMemories(all);
  const today = todayStr();
  if (birth && birth <= today) {
    const total = monthsBetween(birth, today);
    const pages: Page[] = [];
    const before = sorted.filter((m) => m.date < birth);
    if (before.length) pages.push({ key: 'pre', index: null, title: 'قبل الميلاد', subtitle: 'ذكريات سبقت ميلاد يمان', start: before[0].date, items: before });
    for (let k = 0; k <= total; k++) {
      const start = addMonths(birth, k);
      const end = addMonths(birth, k + 1);
      pages.push({
        key: `m${k}`,
        index: k,
        title: k < 12 ? `الشهر ${ORD[k]}` : `الشهر ${num(k + 1)}`,
        subtitle: `${formatDate(start)} – ${formatDate(addDaysStr(end, -1))}`,
        start,
        items: sorted.filter((m) => m.date >= start && m.date < end),
      });
    }
    return pages;
  }
  const first = sorted.length ? sorted[0].date.slice(0, 7) : today.slice(0, 7);
  const pages: Page[] = [];
  let cur = `${first}-01`;
  const lastKey = today.slice(0, 7);
  for (let i = 0; i < 600; i++) {
    const key = cur.slice(0, 7);
    pages.push({ key, index: null, title: formatMonth(cur), subtitle: '', start: cur > today ? today : cur, items: sorted.filter((m) => m.date.startsWith(key)) });
    if (key >= lastKey) break;
    cur = addMonths(cur, 1);
  }
  return pages;
}

function addDaysStr(s: string, n: number): string {
  const d = parse(s);
  d.setDate(d.getDate() + n);
  return toStr(d);
}

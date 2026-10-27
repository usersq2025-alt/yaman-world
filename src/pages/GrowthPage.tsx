import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { Memory } from '../types';
import { buildPages, type Page } from '../lib/timeline';
import { memoriesLabel, num, parse } from '../lib/format';
import MemoryCard, { useMediaUrl } from '../components/MemoryCard';
import Icon from '../components/Icons';

const YEAR_ORD = ['الأولى', 'الثانية', 'الثالثة', 'الرابعة', 'الخامسة', 'السادسة', 'السابعة', 'الثامنة', 'التاسعة', 'العاشرة', 'الحادية عشرة', 'الثانية عشرة'];
const monthLong = new Intl.DateTimeFormat('ar-u-ca-gregory-nu-latn', { month: 'long' });

/**
 * The journey is two levels so it stays usable for years: pick a year (by Yaman's age once the
 * birth date is known, otherwise by calendar year), then one of that year's months. Every chip
 * and cell shows how many memories it holds, so a long childhood can be scanned at a glance.
 */
interface Year { id: number; label: string; sub: string; pages: Page[]; count: number }

function yearId(p: Page): number {
  if (p.index !== null) return Math.floor(p.index / 12);
  if (p.key === 'pre') return -1;
  return Number(p.key.slice(0, 4));
}

function groupYears(pages: Page[], byAge: boolean): Year[] {
  const map = new Map<number, Page[]>();
  for (const p of pages) map.set(yearId(p), [...(map.get(yearId(p)) ?? []), p]);
  return [...map.entries()].map(([id, ps]) => ({
    id,
    pages: ps,
    count: ps.reduce((n, p) => n + p.items.length, 0),
    label: !byAge ? String(id) : id === -1 ? 'قبل الميلاد' : id < 12 ? `السنة ${YEAR_ORD[id]}` : `السنة ${id + 1}`,
    sub: byAge && id >= 0 ? `من عمر ${id} إلى ${id + 1}` : '',
  }));
}

function cellLabel(p: Page, byAge: boolean): string {
  if (byAge && p.index !== null) return String((p.index % 12) + 1);
  if (p.key === 'pre') return '•';
  return monthLong.format(parse(`${p.key}-01`));
}

function Thumb({ m, on, onClick }: { m: Memory; on: boolean; onClick: () => void }) {
  const url = useMediaUrl(m);
  return (
    <button className={`thumb ${on ? 'on' : ''}`} onClick={onClick} aria-pressed={on} aria-label={m.kind === 'image' ? 'صورة' : m.kind === 'video' ? 'فيديو' : 'تسجيل صوتي'}>
      {m.kind === 'image' && url ? <img src={url} alt="" /> : <Icon name={m.kind} size={22} />}
    </button>
  );
}

interface Props {
  memories: Memory[];
  birth: string | null;
  onAdd: (date: string) => void;
  onBirth: () => void;
}

export default function GrowthPage({ memories, birth, onAdd, onBirth }: Props) {
  const pages = useMemo(() => buildPages(memories, birth), [memories, birth]);
  const byAge = !!birth;
  const years = useMemo(() => groupYears(pages, byAge), [pages, byAge]);
  const [i, setI] = useState(pages.length - 1);
  const [dir, setDir] = useState(0);
  const [sel, setSel] = useState(0);
  const yearStrip = useRef<HTMLDivElement>(null);
  const idx = Math.min(i, pages.length - 1);
  const page = pages[idx];
  const year = years.find((y) => y.id === yearId(page)) ?? years[years.length - 1];

  const go = (n: number) => {
    if (n < 0 || n >= pages.length || n === idx) return;
    setDir(n > idx ? 1 : -1);
    setI(n);
    setSel(0);
  };

  const pickYear = (y: Year) => {
    const withMem = [...y.pages].reverse().find((p) => p.items.length) ?? y.pages[y.pages.length - 1];
    go(pages.indexOf(withMem));
  };

  useEffect(() => {
    yearStrip.current?.querySelector('[aria-current=true]')?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  }, [year?.id]);

  const m = page.items[Math.min(sel, page.items.length - 1)];

  return (
    <div className="growth">
      {!birth && <p className="panel slim">الصفحات حسب السنوات والأشهر الميلادية إلى أن تضيفي تاريخ ميلاد يمان.</p>}

      {years.length > 1 && (
        <div className="years-strip" ref={yearStrip} role="tablist" aria-label="السنوات">
          {years.map((y, yi) => (
            <button key={y.id} style={{ ['--i' as string]: Math.min(yi, 10) }} role="tab" aria-selected={y.id === year.id} aria-current={y.id === year.id} className={`year-chip ${y.id === year.id ? 'on' : ''}`} onClick={() => pickYear(y)}>
              <b>{y.label}</b>
              <small>{y.sub ? `${y.sub} · ${num(y.count)}` : memoriesLabel(y.count)}</small>
            </button>
          ))}
        </div>
      )}

      <div className="months-grid" role="tablist" aria-label="الأشهر">
        {year.pages.map((p, pi) => {
          const n = pages.indexOf(p);
          return (
            <button key={p.key} style={{ ['--i' as string]: pi }} role="tab" aria-selected={n === idx} aria-current={n === idx} aria-label={`${p.title}، ${memoriesLabel(p.items.length)}`} className={`month-cell ${n === idx ? 'on' : ''} ${p.items.length ? 'has' : ''}`} onClick={() => go(n)}>
              <span className="mc-label">{cellLabel(p, byAge)}</span>
              {byAge && <small>شهر</small>}
              {p.items.length > 0 && <em>{num(p.items.length)}</em>}
            </button>
          );
        })}
      </div>

      <div className="book">
        <AnimatePresence mode="wait" initial={false} custom={dir}>
          <motion.section
            key={page.key}
            initial={{ opacity: 0, x: dir * -14 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, d) => (d.offset.x > 70 ? go(idx - 1) : d.offset.x < -70 && go(idx + 1))}
            className="panel page-panel"
          >
            <div className="page-head">
              <h2>{page.title}{byAge && page.index !== null ? <small className="yr"> · {year.label}</small> : null}</h2>
              {page.subtitle && <p className="hint">{page.subtitle}</p>}
              <p className="hint">{memoriesLabel(page.items.length)}</p>
            </div>

            {m ? (
              <>
                <MemoryCard m={m} birth={birth} />
                {page.items.length > 1 && (
                  <div className="thumbs" aria-label="لحظات هذا الشهر">
                    {page.items.map((x, n) => (
                      <Thumb key={x.id} m={x} on={n === Math.min(sel, page.items.length - 1)} onClick={() => setSel(n)} />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="empty">
                <p>لا توجد ذكريات في هذا الشهر.</p>
                <button className="ghost" onClick={() => onAdd(page.start)}>
                  <Icon name="plus" size={20} /> أضيفي ذكرى لهذا الشهر
                </button>
              </div>
            )}

            <nav className="pager" aria-label="تقليب الأشهر">
              <button className="ghost" onClick={() => go(idx - 1)} disabled={idx === 0}>
                <Icon name="next" size={18} /> الأسبق
              </button>
              <span aria-live="polite">
                {num(idx + 1)} من {num(pages.length)}
              </span>
              <button className="ghost" onClick={() => go(idx + 1)} disabled={idx === pages.length - 1}>
                الأحدث <Icon name="prev" size={18} />
              </button>
            </nav>
          </motion.section>
        </AnimatePresence>
      </div>

      {!birth && (
        <button className="link small" onClick={onBirth}>أضيفي تاريخ ميلاد يمان لتصير الصفحات حسب عمره</button>
      )}
    </div>
  );
}



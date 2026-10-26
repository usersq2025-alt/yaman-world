import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { Memory } from '../types';
import { buildPages } from '../lib/timeline';
import { memoriesLabel, num } from '../lib/format';
import Sheet from './Sheet';
import MemoryCard from './MemoryCard';
import Icon from './Icons';

const LEAF = 'M0 0C15 -11 15 -27 0 -38C-15 -27 -15 -11 0 0Z';

/** A little plant that is taller and leafier the later the month: growth you can see while paging. */
function MonthPlant({ k }: { k: number }) {
  const stage = Math.min(k, 14) / 14;
  const h = 70 + stage * 70;
  const pairs = 1 + Math.round(stage * 5);
  return (
    <svg className="mplant" viewBox="0 0 120 170" aria-hidden="true">
      <ellipse cx={60} cy={158} rx={34 + stage * 14} ry={6} fill="#E8DCCB" />
      <path d={`M60 158C58 ${158 - h / 2} 62 ${158 - h * 0.8} 60 ${158 - h}`} stroke="#405A48" strokeWidth={3.4} fill="none" strokeLinecap="round" />
      {Array.from({ length: pairs }, (_, i) => {
        const y = 150 - ((i + 1) * (h - 14)) / (pairs + 0.6);
        const sc = 0.55 + (i / Math.max(1, pairs)) * 0.5;
        return [-1, 1].map((s) => (
          <g key={`${i}${s}`} transform={`translate(60 ${y}) rotate(${s * 58}) scale(${sc})`}>
            <g className="sway" style={{ ['--sd' as string]: `${i * 0.4 + (s > 0 ? 0.5 : 0)}s` }}>
              <path d={LEAF} fill={i % 3 === 2 ? '#B9C7CC' : '#A8B8A0'} stroke="#405A48" strokeOpacity={0.5} strokeWidth={1.2} />
            </g>
          </g>
        ));
      })}
      {k >= 12 && <circle cx={60} cy={158 - h - 4} r={4.5} fill="#C9A86A" />}
    </svg>
  );
}

function Thumb({ m, on, onClick }: { m: Memory; on: boolean; onClick: () => void }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (m.kind !== 'image') return;
    if (m.svg) return setUrl(`data:image/svg+xml;utf8,${encodeURIComponent(m.svg)}`);
    if (!m.blob) return;
    const u = URL.createObjectURL(m.blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [m]);
  return (
    <button className={`thumb ${on ? 'on' : ''}`} onClick={onClick} aria-pressed={on} aria-label={m.kind === 'image' ? 'صورة' : m.kind === 'video' ? 'فيديو' : 'تسجيل صوتي'}>
      {url ? <img src={url} alt="" /> : <Icon name={m.kind} size={22} />}
    </button>
  );
}

interface Props {
  memories: Memory[];
  birth: string | null;
  onClose: () => void;
  onAdd: (date: string) => void;
  onBirth: () => void;
}

export default function Timeline({ memories, birth, onClose, onAdd, onBirth }: Props) {
  const pages = useMemo(() => buildPages(memories, birth), [memories, birth]);
  const [i, setI] = useState(pages.length - 1);
  const [dir, setDir] = useState(0);
  const [sel, setSel] = useState(0);
  const strip = useRef<HTMLDivElement>(null);
  const page = pages[Math.min(i, pages.length - 1)];

  const go = (n: number) => {
    if (n < 0 || n >= pages.length || n === i) return;
    setDir(n > i ? 1 : -1);
    setI(n);
    setSel(0);
  };

  useEffect(() => {
    strip.current?.querySelector('[aria-current=true]')?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  }, [i]);

  const m = page.items[Math.min(sel, page.items.length - 1)];
  const label = (p: (typeof pages)[number]) => (p.index !== null ? num(p.index + 1) : p.key === 'pre' ? '٠' : p.title.split(' ')[0].slice(0, 3));

  return (
    <Sheet title="رحلة يمان" onClose={onClose}>
      {!birth && (
        <p className="note tl-note">
          الصفحات الآن حسب الأشهر الميلادية. <button className="link small" onClick={onBirth}>أضيفي تاريخ الميلاد</button> لتصير حسب عمر يمان.
        </p>
      )}
      <div className="strip" ref={strip} role="tablist" aria-label="أشهر يمان">
        {pages.map((p, n) => (
          <button key={p.key} role="tab" aria-selected={n === i} aria-current={n === i} aria-label={p.title} className={`chip ${n === i ? 'on' : ''} ${p.items.length ? 'has' : ''}`} onClick={() => go(n)}>
            {label(p)}
          </button>
        ))}
      </div>

      <div className="book">
        <AnimatePresence mode="wait" initial={false} custom={dir}>
          <motion.section
            key={page.key}
            custom={dir}
            initial={{ opacity: 0, x: dir * -60, rotateY: dir * 18 }}
            animate={{ opacity: 1, x: 0, rotateY: 0 }}
            exit={{ opacity: 0, x: dir * 60, rotateY: dir * -18 }}
            transition={{ duration: 0.28 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, d) => (d.offset.x > 70 ? go(i - 1) : d.offset.x < -70 && go(i + 1))}
            className="page"
          >
            <div className="page-head">
              {page.index !== null && <MonthPlant k={page.index} />}
              <div>
                <h3>{page.title}</h3>
                {page.subtitle && <p className="hint">{page.subtitle}</p>}
                <p className="hint">{memoriesLabel(page.items.length)}</p>
              </div>
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
                <p>لا توجد ذكريات في هذا الشهر بعد.</p>
                <button className="ghost" onClick={() => onAdd(page.start)}>
                  <Icon name="plus" size={20} /> أضيفي ذكرى لهذا الشهر
                </button>
              </div>
            )}
          </motion.section>
        </AnimatePresence>
      </div>

      <nav className="pager" aria-label="تقليب الصفحات">
        <button className="ghost" onClick={() => go(i - 1)} disabled={i === 0}>
          <Icon name="next" size={18} /> الأسبق
        </button>
        <span aria-live="polite">
          {num(i + 1)} من {num(pages.length)}
        </span>
        <button className="ghost" onClick={() => go(i + 1)} disabled={i === pages.length - 1}>
          الأحدث <Icon name="prev" size={18} />
        </button>
      </nav>
    </Sheet>
  );
}

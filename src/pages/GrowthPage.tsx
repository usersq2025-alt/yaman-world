import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { Memory } from '../types';
import { buildPages } from '../lib/timeline';
import { memoriesLabel, num } from '../lib/format';
import MemoryCard, { useMediaUrl } from '../components/MemoryCard';
import Icon from '../components/Icons';

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
  const [i, setI] = useState(pages.length - 1);
  const [dir, setDir] = useState(0);
  const [sel, setSel] = useState(0);
  const strip = useRef<HTMLDivElement>(null);
  const idx = Math.min(i, pages.length - 1);
  const page = pages[idx];

  const go = (n: number) => {
    if (n < 0 || n >= pages.length || n === idx) return;
    setDir(n > idx ? 1 : -1);
    setI(n);
    setSel(0);
  };

  useEffect(() => {
    strip.current?.querySelector('[aria-current=true]')?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  }, [idx]);

  const m = page.items[Math.min(sel, page.items.length - 1)];
  const chipLabel = (p: (typeof pages)[number]) => (p.index !== null ? num(p.index + 1) : p.key === 'pre' ? '٠' : p.title.split(' ')[0]);

  return (
    <div className="growth">
      {!birth && (
        <p className="panel slim">
          الصفحات الآن حسب الأشهر الميلادية. <button className="link small" onClick={onBirth}>أضيفي تاريخ الميلاد</button> لتصير حسب عمر يمان.
        </p>
      )}

      <div className="strip" ref={strip} role="tablist" aria-label="أشهر يمان">
        {pages.map((p, n) => (
          <button key={p.key} role="tab" aria-selected={n === idx} aria-current={n === idx} aria-label={p.title} className={`chip ${n === idx ? 'on' : ''} ${p.items.length ? 'has' : ''}`} onClick={() => go(n)}>
            {chipLabel(p)}
          </button>
        ))}
      </div>

      <div className="book">
        <AnimatePresence mode="wait" initial={false} custom={dir}>
          <motion.section
            key={page.key}
            initial={{ opacity: 0, x: dir * -40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir * 40 }}
            transition={{ duration: 0.25 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, d) => (d.offset.x > 70 ? go(idx - 1) : d.offset.x < -70 && go(idx + 1))}
            className="panel page-panel"
          >
            <div className="page-head">
              <h2>{page.title}</h2>
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
    </div>
  );
}

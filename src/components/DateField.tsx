import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { addDays, formatDate, parse, toStr, todayStr } from '../lib/format';
import Icon from './Icons';

/**
 * Date picker built for this app instead of the browser's native one: Arabic month names,
 * week starting on Saturday, large touch targets, a month/year grid for jumping across years
 * (birth dates, letters opened far in the future), and optional shortcuts. Digits are 0-9.
 */

const WEEK = [
  { s: 'س', l: 'السبت' }, { s: 'ح', l: 'الأحد' }, { s: 'ن', l: 'الاثنين' }, { s: 'ث', l: 'الثلاثاء' },
  { s: 'ر', l: 'الأربعاء' }, { s: 'خ', l: 'الخميس' }, { s: 'ج', l: 'الجمعة' },
];
const monthName = new Intl.DateTimeFormat('ar-u-ca-gregory-nu-latn', { month: 'long' });
const MONTHS = Array.from({ length: 12 }, (_, i) => monthName.format(new Date(2024, i, 1)));
/** Saturday = 0 */
const weekIndex = (d: Date) => (d.getDay() + 1) % 7;

interface CalProps {
  value: string;
  min?: string;
  max?: string;
  shortcuts?: { label: string; value: string }[];
  onPick: (v: string) => void;
}

export function Calendar({ value, min, max, shortcuts, onPick }: CalProps) {
  const today = todayStr();
  const start = value || (max && max < today ? max : min && min > today ? min : today);
  const [view, setView] = useState(() => ({ y: parse(start).getFullYear(), m: parse(start).getMonth() }));
  const [mode, setMode] = useState<'days' | 'months' | 'years'>('days');
  const [focus, setFocus] = useState<string>(value || start);
  const grid = useRef<HTMLDivElement>(null);
  const yearsRef = useRef<HTMLDivElement>(null);

  const minY = min ? parse(min).getFullYear() : parse(today).getFullYear() - 110;
  const maxY = max ? parse(max).getFullYear() : parse(today).getFullYear() + 110;
  const off = (d: string) => (min != null && d < min) || (max != null && d > max);

  const cells = useMemo(() => {
    const first = new Date(view.y, view.m, 1);
    const count = new Date(view.y, view.m + 1, 0).getDate();
    const out: (string | null)[] = Array(weekIndex(first)).fill(null);
    for (let d = 1; d <= count; d++) out.push(toStr(new Date(view.y, view.m, d)));
    while (out.length % 7) out.push(null);
    return out;
  }, [view]);

  const shift = (dm: number) => {
    const d = new Date(view.y, view.m + dm, 1);
    setView({ y: d.getFullYear(), m: d.getMonth() });
  };
  const monthOff = (y: number, m: number) => off(toStr(new Date(y, m + 1, 0))) && off(toStr(new Date(y, m, 1)));
  const canPrev = !min || toStr(new Date(view.y, view.m, 0)) >= min;
  const canNext = !max || toStr(new Date(view.y, view.m + 1, 1)) <= max;

  useEffect(() => {
    if (mode === 'years') yearsRef.current?.querySelector('[aria-pressed=true]')?.scrollIntoView({ block: 'center' });
  }, [mode]);

  const key = (e: React.KeyboardEvent) => {
    const step: Record<string, number> = { ArrowRight: -1, ArrowLeft: 1, ArrowUp: -7, ArrowDown: 7 };
    if (!(e.key in step)) return;
    e.preventDefault();
    const next = addDays(focus, step[e.key]);
    if (off(next)) return;
    const d = parse(next);
    setFocus(next);
    setView({ y: d.getFullYear(), m: d.getMonth() });
    requestAnimationFrame(() => grid.current?.querySelector<HTMLElement>(`[data-d="${next}"]`)?.focus());
  };

  return (
    <div className="cal">
      <div className="cal-head">
        <button type="button" className="icon-btn" onClick={() => (mode === 'days' ? shift(-1) : setView((v) => ({ ...v, y: v.y - (mode === 'years' ? 12 : 1) })))} disabled={mode === 'days' ? !canPrev : false} aria-label="السابق">
          <Icon name="prev" size={20} />
        </button>
        <button type="button" className="cal-title" onClick={() => setMode(mode === 'days' ? 'months' : mode === 'months' ? 'years' : 'days')} aria-live="polite">
          {mode === 'years' ? 'اختاري السنة' : mode === 'months' ? view.y : `${MONTHS[view.m]} ${view.y}`}
          <span className="cal-caret" aria-hidden="true" />
        </button>
        <button type="button" className="icon-btn" onClick={() => (mode === 'days' ? shift(1) : setView((v) => ({ ...v, y: v.y + (mode === 'years' ? 12 : 1) })))} disabled={mode === 'days' ? !canNext : false} aria-label="التالي">
          <Icon name="next" size={20} />
        </button>
      </div>

      {mode === 'days' && (
        <div className="cal-body" role="grid" aria-label={`${MONTHS[view.m]} ${view.y}`} ref={grid} onKeyDown={key}>
          <div className="cal-week" role="row">
            {WEEK.map((w) => <span key={w.l} role="columnheader" aria-label={w.l}>{w.s}</span>)}
          </div>
          <div className="cal-days">
            {cells.map((d, i) =>
              d ? (
                <button
                  type="button"
                  key={d}
                  data-d={d}
                  role="gridcell"
                  className={`day ${d === value ? 'sel' : ''} ${d === today ? 'today' : ''}`}
                  disabled={off(d)}
                  tabIndex={d === focus ? 0 : -1}
                  aria-label={formatDate(d)}
                  aria-selected={d === value}
                  onClick={() => onPick(d)}
                >
                  {Number(d.slice(8))}
                </button>
              ) : (
                <span key={`e${i}`} />
              ),
            )}
          </div>
        </div>
      )}

      {mode === 'months' && (
        <div className="cal-grid">
          {MONTHS.map((n, m) => (
            <button type="button" key={n} className={`cell ${view.m === m && value && parse(value).getFullYear() === view.y && parse(value).getMonth() === m ? 'sel' : ''}`} disabled={monthOff(view.y, m)} onClick={() => { setView({ y: view.y, m }); setMode('days'); }}>
              {n}
            </button>
          ))}
        </div>
      )}

      {mode === 'years' && (
        <div className="cal-grid years" ref={yearsRef}>
          {Array.from({ length: maxY - minY + 1 }, (_, i) => minY + i).map((y) => (
            <button type="button" key={y} aria-pressed={y === view.y} className={`cell ${y === view.y ? 'sel' : ''}`} onClick={() => { setView((v) => ({ ...v, y })); setMode('months'); }}>
              {y}
            </button>
          ))}
        </div>
      )}

      {shortcuts && shortcuts.length > 0 && mode === 'days' && (
        <div className="cal-short">
          {shortcuts.filter((s) => !off(s.value)).map((s) => (
            <button type="button" key={s.label} className="chip small" onClick={() => onPick(s.value)}>{s.label}</button>
          ))}
        </div>
      )}
    </div>
  );
}

interface FieldProps extends Omit<CalProps, 'onPick'> {
  label: string;
  placeholder?: string;
  onChange: (v: string) => void;
}

export default function DateField({ label, value, onChange, placeholder = 'اختاري اليوم', ...cal }: FieldProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className="field datefield">
      <span>{label}</span>
      <button type="button" className={`date-btn ${open ? 'open' : ''}`} onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className={value ? '' : 'ph'}>{value ? formatDate(value) : placeholder}</span>
        <Icon name="calendar" size={20} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} style={{ overflow: 'hidden' }}>
            <Calendar
              {...cal}
              value={value}
              onPick={(v) => {
                onChange(v);
                setOpen(false);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

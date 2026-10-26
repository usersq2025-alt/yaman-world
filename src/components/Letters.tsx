import { useEffect, useRef, useState } from 'react';
import { repo } from '../data';
import type { Letter, LetterMeta } from '../types';
import { daysUntil, formatDate, num, todayStr, addDays } from '../lib/format';
import { addMonths } from '../lib/timeline';
import Sheet from './Sheet';
import Icon from './Icons';

function Envelope({ open, sealed }: { open: boolean; sealed: boolean }) {
  return (
    <svg className={`env ${open ? 'is-open' : ''}`} viewBox="0 0 120 84" aria-hidden="true">
      <rect x="3" y="12" width="114" height="69" rx="8" fill="#E8DCCB" stroke="#405A48" strokeOpacity=".35" />
      {open && <rect x="16" y="2" width="88" height="50" rx="4" fill="#F8F5EF" stroke="#405A48" strokeOpacity=".25" />}
      <path d="M5 16l55 37 55-37" fill={open ? '#F3ECE0' : '#DCCDB6'} stroke="#405A48" strokeOpacity=".35" transform={open ? 'translate(0 -4)' : ''} />
      <path d="M5 79l40-31M115 79L75 48" stroke="#405A48" strokeOpacity=".25" fill="none" />
      {sealed && (
        <g>
          <circle cx="60" cy="52" r="11" fill="#C9A86A" />
          <path d="M60 58V47M60 51c-3-1-5-3-5-5M60 51c3-1 5-3 5-5" stroke="#405A48" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        </g>
      )}
    </svg>
  );
}

function Reader({ letter, onBack }: { letter: Letter; onBack: () => void }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!letter.blob) return;
    const u = URL.createObjectURL(letter.blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [letter]);
  return (
    <div className="paper reveal">
      <p className="hint">{letter.occasion} · فُتحت في موعدها {formatDate(letter.openAt)}</p>
      {letter.kind === 'text' ? <p className="letter-text">{letter.text}</p> : url && <audio src={url} controls preload="metadata" className="letter-audio" />}
      <button className="ghost" onClick={onBack}>العودة إلى الرسائل</button>
    </div>
  );
}

const OCCASIONS = ['عيد ميلاده الأول', 'أول يوم مدرسة', 'عيد ميلاده العاشر', 'تاريخ آخر'] as const;

function Compose({ birth, onDone, onCancel }: { birth: string | null; onDone: () => void; onCancel: () => void }) {
  const [occasion, setOccasion] = useState<string>(OCCASIONS[0]);
  const [date, setDate] = useState(birth ? addMonths(birth, 12) : '');
  const [kind, setKind] = useState<'text' | 'audio'>('text');
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [rec, setRec] = useState<MediaRecorder | null>(null);
  const [secs, setSecs] = useState(0);
  const [err, setErr] = useState('');
  const [sealing, setSealing] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const tomorrow = addDays(todayStr(), 1);
  const canRecord = !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined';

  useEffect(() => {
    if (!rec) return;
    const t = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [rec]);
  useEffect(() => () => rec?.stream.getTracks().forEach((t) => t.stop()), [rec]);

  const choose = (o: string) => {
    setOccasion(o);
    if (o === OCCASIONS[0] && birth) setDate(addMonths(birth, 12));
    else if (o === OCCASIONS[2] && birth) setDate(addMonths(birth, 120));
    else setDate('');
  };

  const startRec = async () => {
    setErr('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const r = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      r.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      r.onstop = () => {
        const mime = r.mimeType || 'audio/webm';
        setFile(new File(chunks, `رسالة.${mime.includes('mp4') ? 'm4a' : mime.includes('ogg') ? 'ogg' : 'webm'}`, { type: mime }));
        stream.getTracks().forEach((t) => t.stop());
        setRec(null);
      };
      r.start();
      setSecs(0);
      setRec(r);
    } catch {
      setErr('تعذّر الوصول إلى الميكروفون. اسمحي للمتصفح باستخدامه أو اختاري ملفًا صوتيًا.');
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || date < tomorrow) return setErr('اختاري يومًا قادمًا لفتح الرسالة.');
    if (kind === 'text' && !text.trim()) return setErr('اكتبي رسالتكِ أولًا.');
    if (kind === 'audio' && !file) return setErr('سجّلي صوتًا أو اختاري ملفًا.');
    if (file && file.size > 25 * 1024 * 1024) return setErr('الملف أكبر من 25 ميغابايت.');
    setSealing(true);
    try {
      await repo.addLetter({ id: crypto.randomUUID(), kind, openAt: date, occasion: occasion === 'تاريخ آخر' ? 'رسالة إلى يمان' : occasion, createdAt: Date.now(), text: kind === 'text' ? text.trim() : undefined, blob: kind === 'audio' ? file! : undefined });
      setTimeout(onDone, 1500);
    } catch {
      setSealing(false);
      setErr('تعذّر الحفظ على هذا الجهاز.');
    }
  };

  if (sealing)
    return (
      <div className="saved" role="status">
        <Envelope open={false} sealed />
        <p>أُغلقت الرسالة، وستنتظر يوم {formatDate(date)}.</p>
      </div>
    );

  const mmss = `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`;
  return (
    <form onSubmit={save}>
      <p className="hint">متى يجب أن يفتح يمان هذه الرسالة؟</p>
      <div className="occ" role="radiogroup" aria-label="المناسبة">
        {OCCASIONS.map((o) => (
          <button type="button" role="radio" aria-checked={occasion === o} key={o} className={`chip wide-chip ${occasion === o ? 'on' : ''}`} onClick={() => choose(o)}>
            {o}
          </button>
        ))}
      </div>
      {!birth && (occasion === OCCASIONS[0] || occasion === OCCASIONS[2]) && <p className="hint">أدخلي تاريخ ميلاد يمان من القائمة ليُحسب الموعد تلقائيًا، أو اختاري اليوم بنفسكِ.</p>}
      <label className="field">
        <span>يوم الفتح</span>
        <input type="date" value={date} min={tomorrow} onChange={(e) => setDate(e.target.value)} required />
      </label>

      <div className="seg two" role="tablist" aria-label="نوع الرسالة">
        <button type="button" role="tab" aria-selected={kind === 'text'} className={kind === 'text' ? 'on' : ''} onClick={() => !rec && setKind('text')}>
          كتابة
        </button>
        <button type="button" role="tab" aria-selected={kind === 'audio'} className={kind === 'audio' ? 'on' : ''} onClick={() => !rec && setKind('audio')}>
          <Icon name="mic" size={20} />صوت
        </button>
      </div>

      {kind === 'text' ? (
        <label className="field">
          <span>رسالتكِ إلى يمان</span>
          <textarea rows={7} value={text} onChange={(e) => setText(e.target.value)} placeholder="اكتبي له ما تريدين أن يقرأه حين يكبر." />
        </label>
      ) : (
        <div className="picker">
          {canRecord && (
            <button type="button" className={`ghost rec ${rec ? 'live' : ''}`} onClick={() => (rec ? rec.stop() : startRec())}>
              <Icon name={rec ? 'stop' : 'mic'} size={20} />
              {rec ? `أوقفي التسجيل ${mmss}` : 'سجّلي رسالة صوتية'}
            </button>
          )}
          <input ref={input} type="file" accept="audio/*" hidden onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          <button type="button" className="ghost" onClick={() => input.current?.click()} disabled={!!rec}>
            <Icon name="upload" size={20} /> أو اختاري ملفًا صوتيًا
          </button>
          {file && <p className="note">{file.name}</p>}
        </div>
      )}

      {err && <p className="error" role="alert">{err}</p>}
      <p className="hint lock-hint">في هذه النسخة التجريبية يُخفى محتوى الرسالة حتى يوم الفتح حسب ساعة هذا الجهاز، لكن الحماية الحقيقية من الفتح المبكر تحتاج خادمًا يطبّقها، وهذا غير موجود بعد.</p>
      <div className="row">
        <button className="primary" type="submit" disabled={!!rec}>أغلقي الرسالة</button>
        <button className="ghost" type="button" onClick={onCancel}>إلغاء</button>
      </div>
    </form>
  );
}

export default function Letters({ birth, onClose }: { birth: string | null; onClose: () => void }) {
  const [list, setList] = useState<LetterMeta[] | null>(null);
  const [mode, setMode] = useState<'list' | 'compose'>('list');
  const [reading, setReading] = useState<Letter | null>(null);
  const [msg, setMsg] = useState('');
  const [del, setDel] = useState<string | null>(null);

  const load = () => repo.listLetters().then((l) => setList([...l].sort((a, b) => a.openAt.localeCompare(b.openAt))));
  useEffect(() => void load(), []);

  const tap = async (l: LetterMeta) => {
    setMsg('');
    const full = await repo.openLetter(l.id);
    if (full) setReading(full);
    else {
      const d = daysUntil(l.openAt);
      setMsg(`هذه الرسالة مغلقة حتى ${formatDate(l.openAt)}${d > 0 ? `، تبقّى ${d === 1 ? 'يوم واحد' : d === 2 ? 'يومان' : `${num(d)} ${d <= 10 ? 'أيام' : 'يومًا'}`}` : ''}.`);
    }
  };

  return (
    <Sheet title="رسائل إلى يمان" onClose={onClose}>
      {mode === 'compose' ? (
        <Compose
          birth={birth}
          onCancel={() => setMode('list')}
          onDone={() => {
            setMode('list');
            load();
          }}
        />
      ) : reading ? (
        <Reader letter={reading} onBack={() => setReading(null)} />
      ) : (
        <>
          {list && list.length === 0 && (
            <div className="empty">
              <Envelope open={false} sealed={false} />
              <p>لا رسائل بعد. اكتبي رسالة، وحدّدي اليوم الذي سيفتحها فيه يمان.</p>
            </div>
          )}
          <ul className="envs">
            {list?.map((l) => {
              const ready = l.openAt <= todayStr();
              return (
                <li key={l.id}>
                  <button className={`env-btn ${ready ? 'ready' : ''}`} onClick={() => tap(l)} aria-label={`${l.occasion}، ${ready ? 'جاهزة للفتح' : `مغلقة حتى ${formatDate(l.openAt)}`}`}>
                    <Envelope open={ready} sealed={!ready} />
                    <span className="env-t">{l.occasion}</span>
                    <span className="env-d">{ready ? 'افتحيها' : `تُفتح في ${formatDate(l.openAt)}`}</span>
                  </button>
                  {del === l.id ? (
                    <div className="confirm">
                      <p>حذف هذه الرسالة نهائيًا؟</p>
                      <div className="row">
                        <button className="danger" onClick={() => repo.removeLetter(l.id).then(() => (setDel(null), load()))}>نعم، احذفيها</button>
                        <button className="ghost" onClick={() => setDel(null)}>أبقيها</button>
                      </div>
                    </div>
                  ) : (
                    <button className="link small danger-link" onClick={() => setDel(l.id)}>حذف</button>
                  )}
                </li>
              );
            })}
          </ul>
          {msg && <p className="note" role="status">{msg}</p>}
          <button className="primary wide" onClick={() => (setMsg(''), setMode('compose'))}>
            <Icon name="plus" size={22} /> اكتبي رسالة جديدة
          </button>
        </>
      )}
    </Sheet>
  );
}


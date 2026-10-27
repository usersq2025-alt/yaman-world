import { useEffect, useRef, useState } from 'react';
import { repo } from '../data';
import type { Letter, LetterMeta } from '../types';
import { addDays, daysUntil, formatDate, num, todayStr } from '../lib/format';
import { addMonths } from '../lib/timeline';
import { newId } from '../lib/id';
import { storageErrorMessage } from '../lib/errors';
import DateField from '../components/DateField';
import Icon from '../components/Icons';

export function Envelope({ open, sealed }: { open: boolean; sealed: boolean }) {
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

const titleOf = (l: { occasion: string }) => l.occasion.trim() || 'رسالة إلى يمان';

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
      <h2 className="paper-title">{titleOf(letter)}</h2>
      <p className="hint">فُتحت في موعدها {formatDate(letter.openAt)}</p>
      {letter.kind === 'text' ? <p className="letter-text">{letter.text}</p> : url && <audio src={url} controls preload="metadata" className="letter-audio" />}
      <button className="ghost" onClick={onBack}>العودة إلى الرسائل</button>
    </div>
  );
}

function Compose({ existing, onDone, onCancel }: { existing?: Letter; onDone: () => void; onCancel: () => void }) {
  const editing = !!existing;
  const today = todayStr();
  const [title, setTitle] = useState(existing?.occasion ?? '');
  const [date, setDate] = useState(existing?.openAt ?? '');
  const [kind, setKind] = useState<'text' | 'audio'>(existing?.kind ?? 'text');
  const [text, setText] = useState(existing?.text ?? '');
  const [file, setFile] = useState<File | null>(null);
  const [rec, setRec] = useState<MediaRecorder | null>(null);
  const [secs, setSecs] = useState(0);
  const [err, setErr] = useState('');
  const [sealing, setSealing] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const min = editing ? today : addDays(today, 1);
  const canRecord = !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined';

  useEffect(() => {
    if (!rec) return;
    const t = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [rec]);
  useEffect(() => () => rec?.stream.getTracks().forEach((t) => t.stop()), [rec]);

  const startRec = async () => {
    setErr('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const r = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      r.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      r.onstop = () => {
        const mime = r.mimeType || 'audio/webm';
        setFile(new File(chunks, `letter.${mime.includes('mp4') ? 'm4a' : mime.includes('ogg') ? 'ogg' : 'webm'}`, { type: mime }));
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
    if (!date || date < min) return setErr(editing ? 'اختاري يومًا لا يسبق اليوم.' : 'اختاري يومًا قادمًا لفتح الرسالة.');
    if (kind === 'text' && !text.trim()) return setErr('اكتبي رسالتكِ أولًا.');
    if (!editing && kind === 'audio' && !file) return setErr('سجّلي صوتًا أو اختاري ملفًا.');
    if (file && file.size > 25 * 1024 * 1024) return setErr('الملف أكبر من 25 ميغابايت.');
    setSealing(true);
    try {
      if (existing) await repo.updateLetter(existing.id, { occasion: title.trim(), openAt: date, ...(existing.kind === 'text' ? { text: text.trim() } : {}) });
      else await repo.addLetter({ id: newId(), kind, openAt: date, occasion: title.trim(), createdAt: Date.now(), text: kind === 'text' ? text.trim() : undefined, blob: kind === 'audio' ? file! : undefined });
      setTimeout(onDone, 1400);
    } catch (e2) {
      setSealing(false);
      setErr(storageErrorMessage(e2));
    }
  };

  if (sealing)
    return (
      <div className="saved" role="status">
        <Envelope open={false} sealed />
        <p>{editing ? 'حُفظ التعديل.' : 'أُغلقت الرسالة.'} ستُفتح يوم {formatDate(date)}.</p>
      </div>
    );

  const mmss = `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`;
  const shortcuts = [
    { label: 'بعد شهر', value: addMonths(today, 1) },
    { label: 'بعد سنة', value: addMonths(today, 12) },
    { label: 'بعد 5 سنوات', value: addMonths(today, 60) },
    { label: 'بعد 10 سنوات', value: addMonths(today, 120) },
    { label: 'بعد 18 سنة', value: addMonths(today, 216) },
  ];

  return (
    <form onSubmit={save}>
      <h2 className="form-title">{editing ? 'تعديل الرسالة' : 'رسالة جديدة'}</h2>

      <label className="field">
        <span>عنوان الرسالة (اختياري)</span>
        <input type="text" value={title} maxLength={60} onChange={(e) => setTitle(e.target.value)} placeholder="مثال: إلى يمان حين يبلغ العاشرة" />
      </label>

      <DateField label="متى يفتحها يمان؟" value={date} min={min} max={addMonths(today, 12 * 100)} onChange={setDate} shortcuts={shortcuts} />

      {!editing && (
        <div className="seg two" role="tablist" aria-label="نوع الرسالة">
          <button type="button" role="tab" aria-selected={kind === 'text'} className={kind === 'text' ? 'on' : ''} onClick={() => !rec && setKind('text')}>كتابة</button>
          <button type="button" role="tab" aria-selected={kind === 'audio'} className={kind === 'audio' ? 'on' : ''} onClick={() => !rec && setKind('audio')}>
            <Icon name="mic" size={20} />صوت
          </button>
        </div>
      )}

      {kind === 'text' ? (
        <label className="field">
          <span>رسالتكِ إلى يمان</span>
          <textarea rows={7} value={text} onChange={(e) => setText(e.target.value)} placeholder="اكتبي له ما تريدين أن يقرأه حين يكبر." />
        </label>
      ) : editing ? (
        <p className="hint">الرسالة الصوتية لا تُستبدل هنا. يمكنكِ تغيير عنوانها وموعد فتحها فقط.</p>
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
        <button className="primary" type="submit" disabled={!!rec}>{editing ? 'احفظي التعديل' : 'أغلقي الرسالة'}</button>
        <button className="ghost" type="button" onClick={onCancel}>إلغاء</button>
      </div>
    </form>
  );
}

export default function LettersPage() {
  const [list, setList] = useState<LetterMeta[] | null>(null);
  const [mode, setMode] = useState<'list' | 'compose' | 'edit'>('list');
  const [editTarget, setEditTarget] = useState<Letter | undefined>();
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

  const edit = async (l: LetterMeta) => {
    setMsg('');
    const full = await repo.getLetterForEdit(l.id);
    if (full) {
      setEditTarget(full);
      setMode('edit');
    }
  };

  if (mode !== 'list')
    return (
      <div className="panel">
        <Compose
          existing={mode === 'edit' ? editTarget : undefined}
          onCancel={() => setMode('list')}
          onDone={() => {
            setMode('list');
            load();
          }}
        />
      </div>
    );

  if (reading)
    return (
      <div className="panel">
        <Reader letter={reading} onBack={() => setReading(null)} />
      </div>
    );

  return (
    <div className="panel">
      <div className="panel-head">
        <p className="hint">رسائل تكتبينها اليوم، ويفتحها يمان في اليوم الذي تختارينه.</p>
        <button className="primary" onClick={() => (setMsg(''), setEditTarget(undefined), setMode('compose'))}>
          <Icon name="plus" size={20} /> اكتبي رسالة
        </button>
      </div>

      {list && list.length === 0 && <p className="empty-note">لا رسائل محفوظة بعد.</p>}

      <ul className="letter-list">
        {list?.map((l) => {
          const ready = l.openAt <= todayStr();
          return (
            <li key={l.id} className={ready ? 'ready' : 'locked'}>
              <button className="letter-row" onClick={() => tap(l)} aria-label={`${titleOf(l)}، ${ready ? 'جاهزة للفتح' : `مغلقة حتى ${formatDate(l.openAt)}`}`}>
                <span className="env-ico"><Envelope open={ready} sealed={!ready} /></span>
                <span className="letter-main">
                  <span className="letter-title">{titleOf(l)}</span>
                  <span className="letter-date">{ready ? 'فُتحت' : 'تُفتح'} {formatDate(l.openAt)}{l.kind === 'audio' ? ' · صوتية' : ''}</span>
                </span>
                <span className={`state ${ready ? 'ready' : 'locked'}`}>
                  {ready ? 'جاهزة للفتح' : (<><Icon name="lock" size={14} /> مغلقة</>)}
                </span>
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
                <div className="letter-tools">
                  <button className="link small" onClick={() => edit(l)}><Icon name="edit" size={16} /> تعديل</button>
                  <button className="link small danger-link" onClick={() => setDel(l.id)}><Icon name="trash" size={16} /> حذف</button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {msg && <p className="note" role="status">{msg}</p>}
    </div>
  );
}

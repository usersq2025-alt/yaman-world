import { useEffect, useMemo, useRef, useState } from 'react';
import type { Kind, Memory } from '../types';
import { todayStr } from '../lib/format';
import Sheet from './Sheet';
import Icon from './Icons';

const KINDS: { k: Kind; label: string; accept: string; verb: string }[] = [
  { k: 'image', label: 'صورة', accept: 'image/*', verb: 'اختاري صورة' },
  { k: 'video', label: 'فيديو', accept: 'video/*', verb: 'اختاري فيديو قصيرًا' },
  { k: 'audio', label: 'صوت', accept: 'audio/*', verb: 'اختاري تسجيلًا صوتيًا' },
];
const MAX_MB: Record<Kind, number> = { image: 25, video: 80, audio: 25 };

interface Props {
  birth: string | null;
  initialDate?: string;
  onClose: () => void;
  onSave: (items: Memory[]) => Promise<void>;
}

export default function AddMemory({ birth, initialDate, onClose, onSave }: Props) {
  const [kind, setKind] = useState<Kind>('image');
  const [files, setFiles] = useState<File[]>([]);
  const [date, setDate] = useState(initialDate && initialDate <= todayStr() ? initialDate : todayStr());
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [phase, setPhase] = useState<'form' | 'saving' | 'done'>('form');
  const input = useRef<HTMLInputElement>(null);

  // voice recording
  const [rec, setRec] = useState<MediaRecorder | null>(null);
  const [secs, setSecs] = useState(0);
  const canRecord = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined';
  useEffect(() => {
    if (!rec) return;
    const t = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [rec]);
  useEffect(() => () => rec?.stream.getTracks().forEach((t) => t.stop()), [rec]);

  const previews = useMemo(() => files.map((f) => (f.type.startsWith('image/') ? URL.createObjectURL(f) : null)), [files]);
  useEffect(() => () => previews.forEach((u) => u && URL.revokeObjectURL(u)), [previews]);

  const cfg = KINDS.find((x) => x.k === kind)!;

  const pick = (list: FileList | null) => {
    if (!list) return;
    const ok: File[] = [];
    let msg = '';
    for (const f of Array.from(list)) {
      if (f.size > MAX_MB[kind] * 1024 * 1024) msg = `تجاوز «${f.name}» الحد المسموح (${MAX_MB[kind]} ميغابايت) لهذا النوع.`;
      else ok.push(f);
    }
    setError(msg);
    setFiles((p) => [...p, ...ok]);
    if (input.current) input.current.value = '';
  };

  const startRec = async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const r = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      r.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      r.onstop = () => {
        const mime = r.mimeType || 'audio/webm';
        const ext = mime.includes('mp4') ? 'm4a' : mime.includes('ogg') ? 'ogg' : 'webm';
        setFiles((p) => [...p, new File(chunks, `تسجيل-${Date.now()}.${ext}`, { type: mime })]);
        stream.getTracks().forEach((t) => t.stop());
        setRec(null);
      };
      r.start();
      setSecs(0);
      setRec(r);
    } catch {
      setError('تعذّر الوصول إلى الميكروفون. اسمحي للمتصفح باستخدامه أو اختاري ملفًا صوتيًا.');
    }
  };

  const save = async () => {
    if (!files.length) return setError('اختاري ملفًا أولًا.');
    setPhase('saving');
    try {
      const now = Date.now();
      const items: Memory[] = files.map((f, i) => ({
        id: crypto.randomUUID(),
        kind,
        date,
        text: text.trim(),
        createdAt: now + i,
        blob: f,
        mime: f.type,
      }));
      await onSave(items);
      setPhase('done');
      setTimeout(onClose, 1250);
    } catch {
      setPhase('form');
      setError('تعذّر الحفظ على هذا الجهاز. قد تكون مساحة التخزين ممتلئة.');
    }
  };

  const mmss = `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`;

  return (
    <Sheet title="أضيفي ذكرى" onClose={onClose}>
      {phase === 'done' ? (
        <div className="saved" role="status">
          <svg viewBox="0 0 120 120" width="120" height="120" aria-hidden="true">
            <circle className="draw" cx="60" cy="60" r="44" pathLength={1} fill="none" stroke="#C9A86A" strokeWidth="3" />
            <path className="draw late" d="M40 62l14 14 28-32" pathLength={1} fill="none" stroke="#405A48" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p>حُفظت الذكرى، وستنبت ورقتها الآن.</p>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <div className="seg" role="tablist" aria-label="نوع الذكرى">
            {KINDS.map((x) => (
              <button
                type="button"
                role="tab"
                aria-selected={kind === x.k}
                key={x.k}
                className={kind === x.k ? 'on' : ''}
                onClick={() => {
                  if (rec) return;
                  setKind(x.k);
                  setFiles([]);
                  setError('');
                }}
              >
                <Icon name={x.k} size={20} />
                {x.label}
              </button>
            ))}
          </div>

          <input ref={input} type="file" hidden accept={cfg.accept} multiple onChange={(e) => pick(e.target.files)} />
          <div className="picker">
            <button type="button" className="drop" onClick={() => input.current?.click()} disabled={!!rec}>
              <Icon name="upload" size={26} />
              <span>{files.length ? 'أضيفي المزيد' : cfg.verb}</span>
              {kind === 'image' && <small>يمكنكِ اختيار عدة صور معًا، لكل صورة ورقتها</small>}
            </button>
            {kind === 'audio' && canRecord && (
              <button type="button" className={`ghost rec ${rec ? 'live' : ''}`} onClick={() => (rec ? rec.stop() : startRec())}>
                <Icon name={rec ? 'stop' : 'mic'} size={20} />
                {rec ? `أوقفي التسجيل ${mmss}` : 'سجّلي صوتًا الآن'}
              </button>
            )}
          </div>

          {files.length > 0 && (
            <ul className="chosen">
              {files.map((f, i) => (
                <li key={f.name + i}>
                  {previews[i] ? <img src={previews[i]!} alt="" /> : <span className="chip-ic"><Icon name={kind} size={20} /></span>}
                  <span className="fname">{f.name}</span>
                  <button type="button" className="icon-btn" aria-label={`إزالة ${f.name}`} onClick={() => setFiles((p) => p.filter((_, j) => j !== i))}>
                    <Icon name="close" size={18} />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <label className="field">
            <span>تاريخ الذكرى</span>
            <input type="date" value={date} max={todayStr()} min={birth ?? undefined} onChange={(e) => setDate(e.target.value || todayStr())} required />
          </label>
          <label className="field">
            <span>وصف (اختياري)</span>
            <textarea rows={3} value={text} maxLength={600} placeholder="ما الذي تريدين تذكّره؟" onChange={(e) => setText(e.target.value)} />
          </label>

          {error && <p className="error" role="alert">{error}</p>}
          <button type="submit" className="primary wide" disabled={phase === 'saving' || !!rec}>
            {phase === 'saving' ? 'جارٍ الحفظ…' : 'احفظي الذكرى'}
          </button>
        </form>
      )}
    </Sheet>
  );
}

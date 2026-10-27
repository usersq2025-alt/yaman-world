import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import type { Memory } from '../types';
import { addDays, num, todayStr } from '../lib/format';
import { storageErrorMessage } from '../lib/errors';
import Sheet from './Sheet';
import MemoryCard from './MemoryCard';
import DateField from './DateField';
import Icon from './Icons';

interface Props {
  list: Memory[]; // all memories, oldest first
  index: number;
  birth: string | null;
  onIndex: (i: number) => void;
  onClose: () => void;
  onDelete: (m: Memory) => Promise<void>;
  onUpdate: (id: string, patch: { date?: string; text?: string }) => Promise<void>;
}

const EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/heic': 'heic', 'video/mp4': 'mp4', 'video/quicktime': 'mov', 'video/webm': 'webm', 'audio/mpeg': 'mp3', 'audio/mp4': 'm4a', 'audio/webm': 'webm', 'audio/ogg': 'ogg', 'audio/wav': 'wav' };

function fileFor(m: Memory): File | null {
  if (!m.blob) return null;
  const ext = EXT[m.blob.type] ?? m.blob.type.split('/')[1] ?? 'bin';
  return new File([m.blob], `yaman-${m.date}.${ext}`, { type: m.blob.type });
}

export default function Viewer({ list, index, birth, onIndex, onClose, onDelete, onUpdate }: Props) {
  const [confirm, setConfirm] = useState(false);
  const [editing, setEditing] = useState(false);
  const [date, setDate] = useState('');
  const [text, setText] = useState('');
  const [err, setErr] = useState('');
  const [note, setNote] = useState('');
  const [dir, setDir] = useState(0);
  const m = list[index];

  useEffect(() => {
    setEditing(false);
    setConfirm(false);
    setErr('');
    setNote('');
  }, [m?.id]);

  if (!m) return null;
  const real = !m.demo && !!m.blob;
  const canShare = real && typeof navigator.canShare === 'function' && navigator.canShare({ files: [fileFor(m)!] });

  const go = (d: number) => {
    const i = index + d;
    if (i < 0 || i >= list.length) return;
    setDir(d);
    onIndex(i);
  };

  const startEdit = () => {
    setDate(m.date);
    setText(m.text);
    setErr('');
    setEditing(true);
  };

  const saveEdit = async () => {
    try {
      await onUpdate(m.id, { date, text: text.trim() });
      setEditing(false);
      setNote('حُفظ التعديل.');
    } catch (e) {
      setErr(storageErrorMessage(e));
    }
  };

  const download = () => {
    const f = fileFor(m)!;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(f);
    a.download = f.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  };

  const share = async () => {
    try {
      await navigator.share({ files: [fileFor(m)!], text: m.text || undefined });
    } catch {
      /* cancelled */
    }
  };

  return (
    <Sheet title="ذكرى من حديقة يمان" onClose={onClose}>
      <motion.div
        key={m.id}
        initial={{ opacity: 0, x: dir * -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        drag={editing ? false : 'x'}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.25}
        onDragEnd={(_, i) => (i.offset.x > 70 ? go(-1) : i.offset.x < -70 && go(1))}
      >
        <MemoryCard m={m} birth={birth} />
      </motion.div>

      {editing ? (
        <form
          className="edit-box"
          onSubmit={(e) => {
            e.preventDefault();
            saveEdit();
          }}
        >
          <DateField label="تاريخ الذكرى" value={date} max={todayStr()} min={birth ?? undefined} onChange={setDate} shortcuts={[{ label: 'اليوم', value: todayStr() }, { label: 'أمس', value: addDays(todayStr(), -1) }]} />
          <label className="field">
            <span>الوصف</span>
            <textarea rows={3} value={text} maxLength={600} onChange={(e) => setText(e.target.value)} placeholder="ما الذي تريدين تذكّره؟" />
          </label>
          {err && <p className="error" role="alert">{err}</p>}
          <div className="row">
            <button className="primary" type="submit">احفظي التعديل</button>
            <button className="ghost" type="button" onClick={() => setEditing(false)}>إلغاء</button>
          </div>
        </form>
      ) : (
        <>
          <nav className="pager" aria-label="التنقل بين الذكريات">
            <button className="ghost" onClick={() => go(-1)} disabled={index === 0}>
              <Icon name="next" size={18} /> الأقدم
            </button>
            <span aria-live="polite">
              {num(index + 1)} من {num(list.length)}
            </span>
            <button className="ghost" onClick={() => go(1)} disabled={index === list.length - 1}>
              الأحدث <Icon name="prev" size={18} />
            </button>
          </nav>

          {note && <p className="note" role="status">{note}</p>}

          {confirm ? (
            <div className="confirm" role="alertdialog" aria-label="تأكيد الحذف">
              <p>هل تريدين حذف هذه الذكرى نهائيًا من هذا الجهاز؟ لا يمكن التراجع عن ذلك.</p>
              <div className="row">
                <button className="danger" onClick={() => onDelete(m).then(() => setConfirm(false))}>نعم، احذفيها</button>
                <button className="ghost" onClick={() => setConfirm(false)}>أبقيها</button>
              </div>
            </div>
          ) : (
            <div className="actions">
              {!m.demo && (
                <button className="act" onClick={startEdit}>
                  <Icon name="edit" size={20} /> تعديل
                </button>
              )}
              {real && (
                <button className="act" onClick={download}>
                  <Icon name="download" size={20} /> تنزيل
                </button>
              )}
              {canShare && (
                <button className="act" onClick={share}>
                  <Icon name="share" size={20} /> مشاركة
                </button>
              )}
              <button className="act danger-act" onClick={() => setConfirm(true)}>
                <Icon name="trash" size={20} /> حذف
              </button>
            </div>
          )}
        </>
      )}
    </Sheet>
  );
}


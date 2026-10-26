import { useState } from 'react';
import { motion } from 'motion/react';
import type { Memory } from '../types';
import { num } from '../lib/format';
import Sheet from './Sheet';
import MemoryCard from './MemoryCard';
import Icon from './Icons';

interface Props {
  list: Memory[]; // all memories, oldest first
  index: number;
  birth: string | null;
  onIndex: (i: number) => void;
  onClose: () => void;
  onDelete: (m: Memory) => Promise<void>;
}

export default function Viewer({ list, index, birth, onIndex, onClose, onDelete }: Props) {
  const [confirm, setConfirm] = useState(false);
  const [dir, setDir] = useState(0);
  const m = list[index];
  if (!m) return null;
  const go = (d: number) => {
    const i = index + d;
    if (i < 0 || i >= list.length) return;
    setConfirm(false);
    setDir(d);
    onIndex(i);
  };
  return (
    <Sheet title="ذكرى من حديقة يمان" onClose={onClose}>
      <motion.div
        key={m.id}
        initial={{ opacity: 0, x: dir * -28 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.35 }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.25}
        onDragEnd={(_, i) => (i.offset.x > 70 ? go(-1) : i.offset.x < -70 && go(1))}
      >
        <MemoryCard m={m} birth={birth} />
      </motion.div>
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
      {confirm ? (
        <div className="confirm" role="alertdialog" aria-label="تأكيد الحذف">
          <p>هل تريدين حذف هذه الذكرى نهائيًا من هذا الجهاز؟ لا يمكن التراجع عن ذلك.</p>
          <div className="row">
            <button className="danger" onClick={() => onDelete(m).then(() => setConfirm(false))}>نعم، احذفيها</button>
            <button className="ghost" onClick={() => setConfirm(false)}>أبقيها</button>
          </div>
        </div>
      ) : (
        <button className="link danger-link" onClick={() => setConfirm(true)}>
          <Icon name="trash" size={18} /> حذف الذكرى
        </button>
      )}
    </Sheet>
  );
}

import { useState } from 'react';
import type { Memory } from '../types';
import MemoryCard from '../components/MemoryCard';
import Icon from '../components/Icons';

/** Surprises with something the mother actually saved. Placeholder (demo) memories are never drawn here. */
function pick(real: Memory[], avoid?: string): Memory | null {
  const rest = real.filter((m) => m.id !== avoid);
  const from = rest.length ? rest : real;
  return from.length ? from[Math.floor(Math.random() * from.length)] : null;
}

interface Props {
  memories: Memory[];
  birth: string | null;
  onGo: (id: string) => void;
  onAdd: () => void;
}

export default function DiscoverPage({ memories, birth, onGo, onAdd }: Props) {
  const real = memories.filter((m) => !m.demo);
  const [m, setM] = useState<Memory | null>(null);
  const [round, setRound] = useState(0);
  const current = m && real.some((r) => r.id === m.id) ? m : null;

  const draw = () => {
    setM(pick(real, current?.id));
    setRound((r) => r + 1);
  };

  if (!real.length)
    return (
      <div className="panel empty-panel">
        <p>حين تضيفين ذكرياتكِ الحقيقية ستفاجئكِ هذه الصفحة بواحدة منها.</p>
        <button className="primary" onClick={onAdd}><Icon name="plus" size={20} /> أضيفي أول ذكرى</button>
      </div>
    );

  if (!current)
    return (
      <div className="panel empty-panel">
        <p>ذكرى قديمة تنتظركِ في الصندوق. افتحيه لنختار لكِ واحدة.</p>
        <button className="primary big" onClick={draw}><Icon name="sparkle" size={22} /> اكتشفي ذكرى</button>
      </div>
    );

  return (
    <div className="panel">
      <div key={round} className="reveal">
        <MemoryCard m={current} birth={birth} />
      </div>
      <div className="row wrap discover-actions">
        <button className="primary" onClick={draw} disabled={real.length < 2}>
          <Icon name="sparkle" size={20} /> ذكرى أخرى
        </button>
        <button className="ghost" onClick={() => onGo(current.id)}>اذهبي إلى الذكرى</button>
      </div>
    </div>
  );
}

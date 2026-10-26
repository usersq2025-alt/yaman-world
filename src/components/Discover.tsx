import { useState } from 'react';
import type { Memory } from '../types';
import Sheet from './Sheet';
import MemoryCard from './MemoryCard';
import Icon from './Icons';

function pick(list: Memory[], avoid?: string): Memory | null {
  const real = list.filter((m) => !m.demo);
  const pool = real.length ? real : list;
  const rest = pool.filter((m) => m.id !== avoid);
  const from = rest.length ? rest : pool;
  return from.length ? from[Math.floor(Math.random() * from.length)] : null;
}

export default function Discover({ list, birth, onClose, onAdd }: { list: Memory[]; birth: string | null; onClose: () => void; onAdd: () => void }) {
  const [m, setM] = useState(() => pick(list));
  const [round, setRound] = useState(0);
  return (
    <Sheet title="ذكرى تنتظركِ" onClose={onClose}>
      {m ? (
        <>
          <div key={round} className="reveal">
            <MemoryCard m={m} birth={birth} />
          </div>
          {list.filter((x) => !x.demo).length === 0 && <p className="hint center">هذه ذكرى تجريبية. حين تضيفين ذكرياتكِ ستظهر هنا ذكرياتكِ أنتِ فقط.</p>}
          <button
            className="primary wide"
            disabled={list.length < 2}
            onClick={() => {
              setM(pick(list, m.id));
              setRound((r) => r + 1);
            }}
          >
            <Icon name="sparkle" size={20} /> ذكرى أخرى
          </button>
        </>
      ) : (
        <div className="empty">
          <p>لا توجد ذكريات بعد لنفاجئكِ بها.</p>
          <button className="primary" onClick={() => (onClose(), onAdd())}>أضيفي أول ذكرى</button>
        </div>
      )}
    </Sheet>
  );
}

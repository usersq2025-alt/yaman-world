import { useMemo } from 'react';
import type { Memory } from '../types';
import { formatDate, memoriesLabel } from '../lib/format';
import { useMediaUrl } from '../components/MemoryCard';
import Icon from '../components/Icons';

function Tile({ m, fresh, onOpen }: { m: Memory; fresh: boolean; onOpen: () => void }) {
  const url = useMediaUrl(m);
  const kind = m.kind === 'image' ? 'صورة' : m.kind === 'video' ? 'فيديو' : 'تسجيل صوتي';
  return (
    <li>
      <button className={`tile tile-${m.kind} ${fresh ? 'fresh' : ''}`} onClick={onOpen} aria-label={`${m.demo ? 'ذكرى تجريبية، ' : ''}${kind}، ${formatDate(m.date)}${m.text ? '، ' + m.text : ''}`}>
        <span className="tile-media">
          {m.kind === 'image' && url && <img src={url} alt="" loading="lazy" />}
          {m.kind === 'video' && url && (
            <>
              <video src={`${url}#t=0.2`} muted playsInline preload="metadata" />
              <span className="badge-play"><Icon name="play" size={20} /></span>
            </>
          )}
          {m.kind === 'audio' && (
            <span className="audio-tile">
              <Icon name="mic" size={30} />
              <span>تسجيل صوتي</span>
            </span>
          )}
          {m.demo && <span className="demo-badge">تجريبية</span>}
        </span>
        <span className="tile-meta">
          <time dateTime={m.date}>{formatDate(m.date)}</time>
          {m.text && <span className="cap-text">{m.text}</span>}
        </span>
      </button>
    </li>
  );
}

interface Props {
  memories: Memory[];
  fresh: Set<string>;
  onOpen: (id: string) => void;
  onAdd: () => void;
  onStorage: () => void;
}

export default function MemoriesPage({ memories, fresh, onOpen, onAdd, onStorage }: Props) {
  const real = memories.filter((m) => !m.demo).length;
  const sorted = useMemo(() => [...memories].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt), [memories]);

  if (!memories.length)
    return (
      <div className="panel empty-panel">
        <p>لا ذكريات هنا بعد. أول صورة أو تسجيل تضيفينه سيبقى في هذا المكان.</p>
        <button className="primary" onClick={onAdd}><Icon name="plus" size={20} /> أضيفي أول ذكرى</button>
      </div>
    );

  return (
    <div className="panel gallery-panel">
      <p className="gallery-note">{memoriesLabel(memories.length)}{real === 0 && " · تجريبية"} · <button className="link small" onClick={onStorage}>محفوظة على هذا الجهاز فقط</button></p>
      <ul className="tiles" aria-label="الذكريات">
      {sorted.map((m) => (
        <Tile key={m.id} m={m} fresh={fresh.has(m.id)} onOpen={() => onOpen(m.id)} />
      ))}
      </ul>
    </div>
  );
}




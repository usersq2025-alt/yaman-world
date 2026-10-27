import { useMemo } from 'react';
import { motion } from 'motion/react';
import type { Memory } from '../types';
import { formatDate, memoriesLabel } from '../lib/format';
import { useMediaUrl } from '../components/MemoryCard';
import Icon from '../components/Icons';

/** Each memory settles into place as it scrolls into view, one after the other (a short stagger per row). */
function Tile({ m, i, fresh, onOpen }: { m: Memory; i: number; fresh: boolean; onOpen: () => void }) {
  const url = useMediaUrl(m);
  const kind = m.kind === 'image' ? 'صورة' : m.kind === 'video' ? 'فيديو' : 'تسجيل صوتي';
  return (
    <motion.li
      initial={{ opacity: 0, y: 26, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '0px 0px -30px 0px' }}
      transition={{ duration: 0.7, ease: [0.22, 0.8, 0.3, 1], delay: Math.min(i, 8) * 0.09 }}
    >
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
    </motion.li>
  );
}

interface Props {
  memories: Memory[];
  fresh: Set<string>;
  onOpen: (id: string) => void;
  onAdd: () => void;
  onStorage: () => void;
  onSlideshow: () => void;
}

export default function MemoriesPage({ memories, fresh, onOpen, onAdd, onStorage, onSlideshow }: Props) {
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
      <div className="gallery-top">
        <p className="gallery-note">
          {memoriesLabel(memories.length)}{real === 0 && ' · تجريبية'}
          <button className="link small" onClick={onStorage}>محفوظة على هذا الجهاز فقط</button>
        </p>
        <button className="play-btn" onClick={onSlideshow}>
          <Icon name="slideshow" size={20} /> عرض الذكريات
        </button>
      </div>
      <ul className="tiles" aria-label="الذكريات">
        {sorted.map((m, i) => (
          <Tile key={m.id} m={m} i={i} fresh={fresh.has(m.id)} onOpen={() => onOpen(m.id)} />
        ))}
      </ul>
    </div>
  );
}

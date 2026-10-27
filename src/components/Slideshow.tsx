import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { Memory } from '../types';
import { ageText, formatDate, num } from '../lib/format';
import { useMediaUrl } from './MemoryCard';
import Icon from './Icons';

const SLIDE_MS = 6000;

function Slide({ m, birth, playing, onEnded }: { m: Memory; birth: string | null; playing: boolean; onEnded: () => void }) {
  const url = useMediaUrl(m);
  const media = useRef<HTMLMediaElement>(null);
  const age = birth ? ageText(birth, m.date) : null;

  useEffect(() => {
    const el = media.current;
    if (!el) return;
    if (playing) el.play().catch(() => { el.muted = true; el.play().catch(() => {}); });
    else el.pause();
  }, [playing, url]);

  return (
    <motion.div className="ss-slide" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1 }}>
      {m.kind === 'image' && url && (
        <>
          <img className="ss-back" src={url} alt="" aria-hidden="true" />
          <div className="ss-stage"><img className="ss-img" src={url} alt={m.text || `ذكرى بتاريخ ${formatDate(m.date)}`} style={{ animationPlayState: playing ? 'running' : 'paused' }} /></div>
        </>
      )}
      {m.kind === 'video' && url && (
        <div className="ss-stage"><video ref={media as React.RefObject<HTMLVideoElement>} className="ss-vid" src={url} playsInline controls onEnded={onEnded} /></div>
      )}
      {m.kind === 'audio' && url && (
        <div className="ss-stage ss-audio">
          <Icon name="mic" size={56} />
          <audio ref={media as React.RefObject<HTMLAudioElement>} src={url} controls onEnded={onEnded} />
        </div>
      )}
      <div className="ss-cap">
        <time dateTime={m.date}>{formatDate(m.date)}</time>
        {age && <span>{age === 'يوم الميلاد' ? age : `في عمر ${age}`}</span>}
        {m.text && <p>{m.text}</p>}
      </div>
    </motion.div>
  );
}

interface Props {
  list: Memory[]; // oldest first
  birth: string | null;
  onClose: () => void;
}

/** A quiet, full-screen walk through the memories in the order they happened. */
export default function Slideshow({ list, birth, onClose }: Props) {
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [done, setDone] = useState(false);
  const m = list[i];

  const next = useCallback(() => {
    setI((c) => {
      if (c >= list.length - 1) {
        setPlaying(false);
        setDone(true);
        return c;
      }
      return c + 1;
    });
  }, [list.length]);
  const prev = () => {
    setDone(false);
    setI((c) => Math.max(0, c - 1));
  };

  useEffect(() => {
    if (!playing || !m || m.kind !== 'image') return;
    const t = setTimeout(next, SLIDE_MS);
    return () => clearTimeout(t);
  }, [playing, i, m, next]);

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') next();
      else if (e.key === 'ArrowRight') prev();
      else if (e.key === ' ' && (e.target as HTMLElement).tagName !== 'BUTTON') (e.preventDefault(), setPlaying((p) => !p));
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [next, onClose]);

  if (!m) return null;

  const replay = () => {
    setI(0);
    setDone(false);
    setPlaying(true);
  };

  return (
    <motion.div className="ss" role="dialog" aria-modal="true" aria-label="عرض الذكريات" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
      <AnimatePresence mode="sync">
        <Slide key={m.id} m={m} birth={birth} playing={playing} onEnded={next} />
      </AnimatePresence>

      <div className="ss-top">
        <button className="ss-btn" onClick={onClose} aria-label="إغلاق العرض"><Icon name="close" /></button>
        <span className="ss-count">{num(i + 1)} / {num(list.length)}</span>
      </div>

      <div className="ss-bar" aria-hidden="true">
        <span key={`${m.id}-${playing}`} className={m.kind === 'image' && playing ? 'run' : ''} style={{ animationDuration: `${SLIDE_MS}ms` }} />
      </div>

      <div className="ss-ctrl">
        <button className="ss-btn" onClick={prev} disabled={i === 0} aria-label="السابقة"><Icon name="prev" /></button>
        {done ? (
          <button className="ss-btn big" onClick={replay} aria-label="إعادة العرض"><Icon name="play" size={26} /></button>
        ) : (
          <button className="ss-btn big" onClick={() => setPlaying((p) => !p)} aria-label={playing ? 'إيقاف مؤقت' : 'تشغيل'}><Icon name={playing ? 'pause' : 'play'} size={26} /></button>
        )}
        <button className="ss-btn" onClick={next} disabled={i === list.length - 1} aria-label="التالية"><Icon name="next" /></button>
      </div>
    </motion.div>
  );
}

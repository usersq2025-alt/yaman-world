import { useEffect, useState } from 'react';
import type { Memory } from '../types';
import { ageText, formatDate } from '../lib/format';

export function useMediaUrl(m: Memory): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (m.svg) {
      setUrl(`data:image/svg+xml;utf8,${encodeURIComponent(m.svg)}`);
      return;
    }
    if (!m.blob) return setUrl(null);
    const u = URL.createObjectURL(m.blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [m]);
  return url;
}

export default function MemoryCard({ m, birth }: { m: Memory; birth: string | null }) {
  const url = useMediaUrl(m);
  const age = birth ? ageText(birth, m.date) : null;
  return (
    <article className="memory">
      <div className={`media media-${m.kind}`}>
        {url && m.kind === 'image' && <img src={url} alt={m.text || `ذكرى بتاريخ ${formatDate(m.date)}`} />}
        {url && m.kind === 'video' && <video src={url} controls playsInline preload="metadata" />}
        {url && m.kind === 'audio' && (
          <div className="audio">
            <svg viewBox="0 0 120 60" aria-hidden="true">
              {[10, 24, 38, 52, 66, 80, 94, 108].map((x, i) => (
                <rect key={x} x={x - 3} y={30 - [8, 16, 24, 12, 22, 14, 18, 8][i]} width={6} height={[16, 32, 48, 24, 44, 28, 36, 16][i]} rx={3} fill="#405A48" opacity={0.7} />
              ))}
            </svg>
            <audio src={url} controls preload="metadata" />
          </div>
        )}
      </div>
      <div className="meta">
        {m.demo && <span className="tag">ذكرى تجريبية</span>}
        <time dateTime={m.date}>{formatDate(m.date)}</time>
        {age && <span className="age">{age === 'يوم الميلاد' ? age : `في عمر ${age}`}</span>}
        {m.text && <p>{m.text}</p>}
      </div>
    </article>
  );
}


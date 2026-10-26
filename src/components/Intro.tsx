const LEAF = 'M0 0C15 -11 15 -27 0 -38C-15 -27 -15 -11 0 0Z';

function L({ x, y, r, k, d, c = '#A8B8A0', cls = '' }: { x: number; y: number; r: number; k: number; d: number; c?: string; cls?: string }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${k})`}>
      <g className={`sway ${cls}`} style={{ ['--sd' as string]: `${d}s` }}>
        <path d={LEAF} fill={c} stroke="#405A48" strokeOpacity={0.55} strokeWidth={1.1} />
        <path d="M0 -3V-31" stroke="#405A48" strokeOpacity={0.4} strokeWidth={0.9} />
      </g>
    </g>
  );
}

export function Sapling({ grown }: { grown: boolean }) {
  return (
    <svg className={`sapling ${grown ? 'grown' : ''}`} viewBox="0 0 200 250" aria-hidden="true">
      <ellipse cx={100} cy={228} rx={74} ry={10} fill="#E8DCCB" />
      <g className="plant">
        <path className="stem" d="M100 228C97 196 104 164 100 118" pathLength={1} stroke="#405A48" strokeWidth={4.2} fill="none" strokeLinecap="round" />
        <g className="leaf-in" style={{ ['--d' as string]: '1.0s' }}>
          <L x={99} y={200} r={-62} k={1.05} d={0} />
          <L x={99} y={200} r={62} k={1.05} d={0.5} c="#B9C7CC" />
        </g>
        <g className="leaf-in" style={{ ['--d' as string]: '1.3s' }}>
          <L x={101} y={166} r={-56} k={1.2} d={0.8} />
          <L x={101} y={166} r={58} k={1.2} d={1.2} />
        </g>
        <g className="leaf-in" style={{ ['--d' as string]: '1.6s' }}>
          <L x={100} y={132} r={-40} k={1.3} d={0.3} />
          <L x={100} y={132} r={42} k={1.3} d={0.9} />
        </g>
        <g className="more">
          <L x={100} y={118} r={-12} k={1.4} d={0.4} />
          <L x={100} y={118} r={14} k={1.25} d={1} c="#B9C7CC" />
          <L x={99} y={152} r={-75} k={1} d={0.6} />
        </g>
        <circle className="bud" cx={100} cy={112} r={4.5} fill="#C9A86A" />
      </g>
    </svg>
  );
}

export default function Intro({ grown, onEnter }: { grown: boolean; onEnter: () => void }) {
  return (
    <main className="intro">
      <div className="intro-inner">
        <h1 className="name">يَمان</h1>
        <p className="sub">حكاية البركة الصغيرة</p>
        <Sapling grown={grown} />
        <p className="line1">منذ أن جاء يَمان، بدأت حكاية جميلة.</p>
        <p className="line2">هنا ستبقى ضحكاته الأولى، وصوره، ولحظاته الصغيرة… لتكبر الحكاية معه يومًا بعد يوم.</p>
        <button className="primary enter" onClick={onEnter} disabled={grown}>
          ادخلي إلى عالم يمان
        </button>
      </div>
    </main>
  );
}

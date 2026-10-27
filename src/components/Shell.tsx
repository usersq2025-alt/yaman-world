import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import Icon from './Icons';
import bgMemories from '../assets/bg/memories.webp';
import bgLetters from '../assets/bg/letters.webp';
import bgGrowth from '../assets/bg/growth.webp';
import bgDiscover from '../assets/bg/discover.webp';

export type Tab = 'memories' | 'letters' | 'growth' | 'discover';

/**
 * One fixed picture per section. The picture is only a backdrop: every button, text and photo
 * on top of it is real UI. `pos` keeps the part of the picture that matters in view when the
 * screen is wider or narrower than the picture's 9:16.
 */
export const TABS: { id: Tab; label: string; title: string; icon: 'photos' | 'mail' | 'sprout' | 'sparkle'; bg: string; pos: string; veil: [number, number, number]; blur: number }[] = [
  { id: 'memories', label: 'الذكريات', title: 'الذكريات', icon: 'photos', bg: bgMemories, pos: '20% 50%', veil: [0.9, 0.84, 0.78], blur: 3 },
  { id: 'letters', label: 'الرسائل', title: 'رسائل إلى يمان', icon: 'mail', bg: bgLetters, pos: '20% 60%', veil: [0.9, 0.72, 0.04], blur: 0 },
  { id: 'growth', label: 'النمو', title: 'رحلة النمو', icon: 'sprout', bg: bgGrowth, pos: '20% 55%', veil: [0.88, 0.62, 0.03], blur: 0 },
  { id: 'discover', label: 'اكتشفي', title: 'اكتشفي ذكرى', icon: 'sparkle', bg: bgDiscover, pos: '20% 60%', veil: [0.9, 0.7, 0.04], blur: 0 },
];

interface Props {
  tab: Tab;
  onTab: (t: Tab) => void;
  onMenu: () => void;
  sub?: ReactNode;
  fab?: { label: string; onClick: () => void };
  children: ReactNode;
}

export default function Shell({ tab, onTab, onMenu, sub, fab, children }: Props) {
  const cur = TABS.find((t) => t.id === tab)!;
  return (
    <div className="screen">
      <img key={cur.bg} className="bg" src={cur.bg} alt="" aria-hidden="true" style={{ objectPosition: cur.pos, filter: cur.blur ? `blur(${cur.blur}px) saturate(.92)` : 'saturate(.95)' }} decoding="async" />
      {/* calm veil: keeps the picture as atmosphere while text and photos stay easy to read */}
      <div className="veil" aria-hidden="true" style={{ ['--v1' as string]: cur.veil[0], ['--v2' as string]: cur.veil[1], ['--v3' as string]: cur.veil[2] }} />

      <div className="scroll" id="scroll">
        <header className="bar">
          <div className="title-block">
            <h1>{cur.title}</h1>
            {sub && <div className="title-sub">{sub}</div>}
          </div>
          <button className="round" onClick={onMenu} aria-label="القائمة">
            <Icon name="menu" />
          </button>
        </header>

        <motion.main key={tab} className="page" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          {children}
        </motion.main>
      </div>

      {fab && (
        <button className="fab" onClick={fab.onClick} aria-label={fab.label}>
          <Icon name="plus" size={28} />
        </button>
      )}

      <nav className="tabbar" aria-label="أقسام عالم يمان">
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? 'on' : ''} aria-current={tab === t.id ? 'page' : undefined} onClick={() => onTab(t.id)}>
            <Icon name={t.icon} size={24} />
            <span>{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}



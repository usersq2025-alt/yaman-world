import { useEffect, useRef, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
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
  { id: 'memories', label: 'الذكريات', title: 'الذكريات', icon: 'photos', bg: bgMemories, pos: '20% 50%', veil: [0.9, 0.72, 0.04], blur: 0 },
  { id: 'letters', label: 'الرسائل', title: 'رسائل إلى يمان', icon: 'mail', bg: bgLetters, pos: '20% 60%', veil: [0.9, 0.72, 0.04], blur: 0 },
  { id: 'growth', label: 'النمو', title: 'رحلة النمو', icon: 'sprout', bg: bgGrowth, pos: '20% 55%', veil: [0.88, 0.62, 0.03], blur: 0 },
  { id: 'discover', label: 'اكتشفي', title: 'اكتشفي ذكرى', icon: 'sparkle', bg: bgDiscover, pos: '20% 60%', veil: [0.9, 0.7, 0.04], blur: 0 },
];

const EASE = [0.22, 0.8, 0.3, 1] as const;

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
  const order = TABS.findIndex((t) => t.id === tab);
  const prev = useRef(order);
  // in a right-to-left layout the next section sits to the left, so its content arrives from the left
  const dir = order === prev.current ? 0 : order > prev.current ? -1 : 1;
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    prev.current = order;
    scroller.current?.scrollTo({ top: 0 });
  }, [order]);

  return (
    <div className="screen">
      <AnimatePresence initial={false}>
        <motion.div key={cur.bg} className="bg-layer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6, ease: 'easeOut' }}>
          <img className="bg" src={cur.bg} alt="" aria-hidden="true" style={{ objectPosition: cur.pos, filter: cur.blur ? `blur(${cur.blur}px) saturate(.92)` : 'saturate(.95)' }} decoding="async" />
          {/* calm veil: keeps the picture as atmosphere while text and photos stay easy to read */}
          <div className="veil" aria-hidden="true" style={{ ['--v1' as string]: cur.veil[0], ['--v2' as string]: cur.veil[1], ['--v3' as string]: cur.veil[2] }} />
        </motion.div>
      </AnimatePresence>

      <div className="scroll" id="scroll" ref={scroller}>
        <header className="bar">
          <div className="title-block">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.h1 key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
                {cur.title}
              </motion.h1>
            </AnimatePresence>
            {sub && <div className="title-sub">{sub}</div>}
          </div>
          <motion.button className="round" onClick={onMenu} aria-label="القائمة" whileTap={{ scale: 0.96 }}>
            <Icon name="menu" />
          </motion.button>
        </header>

        <AnimatePresence mode="popLayout" initial={false} custom={dir}>
          <motion.main
            key={tab}
            className="page"
            custom={dir}
            initial={{ opacity: 0, x: dir * 10 }}
            animate={{ opacity: 1, x: 0, transition: { duration: 0.32, ease: EASE } }}
            exit={{ opacity: 0, transition: { duration: 0.12 } }}
          >
            {children}
          </motion.main>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {fab && (
          <motion.button
            key="fab"
            className="fab"
            onClick={fab.onClick}
            aria-label={fab.label}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.3, ease: EASE, delay: 0.1 }}
            whileTap={{ scale: 0.96 }}
          >
            <Icon name="plus" size={28} />
          </motion.button>
        )}
      </AnimatePresence>

      <nav className="tabbar" aria-label="أقسام عالم يمان">
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? 'on' : ''} aria-current={tab === t.id ? 'page' : undefined} onClick={() => onTab(t.id)}>
            <span className="ico">
              {tab === t.id && <motion.span layoutId="tab-pill" className="pill" transition={{ duration: 0.28, ease: EASE }} />}
              <span className="ico-in">
                <Icon name={t.icon} size={24} />
              </span>
            </span>
            <span>{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}



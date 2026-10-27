import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { repo } from './data';
import { demoMemories } from './data/demo';
import { sortMemories } from './lib/layout';
import { ageText, todayStr } from './lib/format';
import type { Memory } from './types';
import Intro from './components/Intro';
import Shell, { type Tab } from './components/Shell';
import AddMemory from './components/AddMemory';
import Viewer from './components/Viewer';
import Menu from './components/Menu';
import Slideshow from './components/Slideshow';
import MemoriesPage from './pages/MemoriesPage';
import LettersPage from './pages/LettersPage';
import GrowthPage from './pages/GrowthPage';
import DiscoverPage from './pages/DiscoverPage';

type Phase = 'intro' | 'entering' | 'main';
type Overlay = null | 'add' | 'menu' | 'slideshow' | { view: string };

const seenIntro = () => {
  try { return localStorage.getItem('yaman-intro') === '1'; } catch { return false; }
};
const markIntro = () => {
  try { localStorage.setItem('yaman-intro', '1'); } catch { /* ignore */ }
};

export default function App() {
  const [phase, setPhase] = useState<Phase>(seenIntro() ? 'main' : 'intro');
  const [grown, setGrown] = useState(false);
  const [tab, setTab] = useState<Tab>('memories');
  const [memories, setMemories] = useState<Memory[]>([]);
  const [birth, setBirth] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [fresh, setFresh] = useState<Set<string>>(new Set());
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [toast, setToast] = useState('');
  const [fatal, setFatal] = useState(false);
  const [addDate, setAddDate] = useState<string | undefined>();

  const refresh = useCallback(async () => setMemories(await repo.listMemories()), []);

  useEffect(() => {
    (async () => {
      try {
        if (!(await repo.isSeeded())) {
          if ((await repo.listMemories()).length === 0) await repo.addMemories(demoMemories());
          await repo.markSeeded();
        }
        await refresh();
        setBirth((await repo.getSettings()).birthDate);
        setReady(true);
      } catch {
        setFatal(true);
      }
    })();
  }, [refresh]);

  const say = (t: string) => {
    setToast(t);
    setTimeout(() => setToast(''), 3600);
  };

  const sorted = useMemo(() => sortMemories(memories), [memories]);

  const enter = () => {
    setGrown(true);
    markIntro();
    setTimeout(() => setPhase('entering'), 1000);
  };

  const openAdd = (date?: string) => {
    setAddDate(date);
    setOverlay('add');
  };

  const save = async (items: Memory[]) => {
    await repo.addMemories(items);
    navigator.storage?.persist?.().catch(() => {});
    // the sheet closes after its confirmation; the new photo is then highlighted in the gallery
    setTimeout(async () => {
      await refresh();
      setFresh(new Set(items.map((i) => i.id)));
      setTimeout(() => setFresh(new Set()), 6000);
    }, 1200);
  };

  const remove = async (m: Memory) => {
    await repo.removeMemory(m.id);
    await refresh();
    const left = sorted.filter((x) => x.id !== m.id);
    if (!left.length) setOverlay(null);
    else setOverlay({ view: left[Math.min(sorted.findIndex((x) => x.id === m.id), left.length - 1)].id });
    say('حُذفت الذكرى من هذا الجهاز.');
  };

  const update = async (id: string, patch: { date?: string; text?: string }) => {
    await repo.updateMemory(id, patch);
    await refresh();
  };

  const slideList = useMemo(() => {
    const real = sorted.filter((m) => !m.demo);
    return real.length ? real : sorted;
  }, [sorted]);

  const viewId = overlay && typeof overlay === 'object' ? overlay.view : null;
  const viewIndex = viewId ? sorted.findIndex((m) => m.id === viewId) : -1;
  const close = useCallback(() => setOverlay(null), []);

  const age = birth ? ageText(birth, todayStr()) : null;
  const sub =
    tab === 'memories' || tab === 'growth' ? (
      age ? (
        <span>{age === 'يوم الميلاد' ? 'اليوم يوم ميلاده' : `عمره الآن ${age}`}</span>
      ) : (
        <button className="link small" onClick={() => setOverlay('menu')}>أضيفي تاريخ ميلاد يمان</button>
      )
    ) : null;

  if (fatal)
    return (
      <main className="fatal">
        <h1>يَمان</h1>
        <p>تعذّر فتح التخزين المحلي في هذا المتصفح. جرّبي نافذة عادية غير خاصة، أو متصفحًا آخر.</p>
      </main>
    );

  return (
    <MotionConfig reducedMotion="user">
      {phase !== 'main' && <Intro grown={grown} onEnter={enter} />}
      {phase !== 'intro' && ready && (
        <motion.div
          className="main-layer"
          initial={phase === 'entering' ? { clipPath: 'circle(0% at 50% 58%)' } : { opacity: 0 }}
          animate={phase === 'entering' ? { clipPath: 'circle(150% at 50% 58%)' } : { opacity: 1 }}
          transition={{ duration: phase === 'entering' ? 1.6 : 0.6, ease: [0.5, 0, 0.2, 1] }}
          onAnimationComplete={() => phase === 'entering' && setPhase('main')}
        >
          <Shell tab={tab} onTab={setTab} onMenu={() => setOverlay('menu')} sub={sub} fab={tab === 'memories' ? { label: 'أضيفي ذكرى', onClick: () => openAdd() } : undefined}>
            {tab === 'memories' && <MemoriesPage memories={memories} fresh={fresh} onOpen={(id) => setOverlay({ view: id })} onAdd={() => openAdd()} onStorage={() => setOverlay('menu')} onSlideshow={() => setOverlay('slideshow')} />}
            {tab === 'letters' && <LettersPage />}
            {tab === 'growth' && <GrowthPage memories={memories} birth={birth} onAdd={(d) => openAdd(d)} onBirth={() => setOverlay('menu')} />}
            {tab === 'discover' && (
              <DiscoverPage
                memories={memories}
                birth={birth}
                onAdd={() => openAdd()}
                onGo={(id) => {
                  setTab('memories');
                  setOverlay({ view: id });
                }}
              />
            )}
          </Shell>
        </motion.div>
      )}

      <AnimatePresence>
        {overlay === 'add' && <AddMemory key="add" birth={birth} initialDate={addDate} onClose={close} onSave={save} />}
        {overlay === 'menu' && (
          <Menu
            key="menu"
            birth={birth}
            hasDemos={memories.some((m) => m.demo)}
            onBirth={async (d) => {
              await repo.saveSettings({ birthDate: d });
              setBirth(d);
            }}
            onClose={close}
            onRemoveDemos={async () => {
              await repo.removeDemos();
              await refresh();
              say('حُذفت الذكريات التجريبية.');
            }}
            onImported={refresh}
            onReplayIntro={() => {
              setOverlay(null);
              setGrown(false);
              setPhase('intro');
            }}
          />
        )}
        {overlay === 'slideshow' && <Slideshow key="slideshow" list={slideList} birth={birth} onClose={close} />}
        {viewIndex >= 0 && (
          <Viewer key="viewer" list={sorted} index={viewIndex} birth={birth} onIndex={(i) => setOverlay({ view: sorted[i].id })} onClose={close} onDelete={remove} onUpdate={update} />
        )}
      </AnimatePresence>

      <div className="toast" role="status" aria-live="polite">{toast}</div>
    </MotionConfig>
  );
}






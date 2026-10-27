import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { repo } from './data';
import { demoMemories } from './data/demo';
import { sortMemories, type Node } from './lib/layout';
import type { Memory } from './types';
import Intro from './components/Intro';
import Garden from './components/Garden';
import AddMemory from './components/AddMemory';
import Viewer from './components/Viewer';
import Menu from './components/Menu';
import Discover from './components/Discover';
import Timeline from './components/Timeline';
import Letters from './components/Letters';

type Phase = 'intro' | 'entering' | 'garden';
type Overlay = null | 'add' | 'menu' | 'discover' | 'timeline' | 'letters' | { view: string };

const seenIntro = () => {
  try { return localStorage.getItem('yaman-intro') === '1'; } catch { return false; }
};
const markIntro = () => {
  try { localStorage.setItem('yaman-intro', '1'); } catch { /* ignore */ }
};

export default function App() {
  const [phase, setPhase] = useState<Phase>(seenIntro() ? 'garden' : 'intro');
  const [grown, setGrown] = useState(false);
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

  const save = async (items: Memory[]) => {
    await repo.addMemories(items);
    navigator.storage?.persist?.().catch(() => {});
    // the sheet closes after its confirmation; the leaf sprouts as it closes
    setTimeout(async () => {
      await refresh();
      const ids = new Set(items.map((i) => i.id));
      setFresh(ids);
      setTimeout(() => setFresh(new Set()), 6000);
    }, 1100);
  };

  const remove = async (m: Memory) => {
    await repo.removeMemory(m.id);
    await refresh();
    const left = sorted.filter((x) => x.id !== m.id);
    if (!left.length) setOverlay(null);
    else setOverlay({ view: left[Math.min(sorted.findIndex((x) => x.id === m.id), left.length - 1)].id });
    say('حُذفت الذكرى من هذا الجهاز.');
  };

  const viewId = overlay && typeof overlay === 'object' ? overlay.view : null;
  const viewIndex = viewId ? sorted.findIndex((m) => m.id === viewId) : -1;
  const open = (n: Node) => setOverlay({ view: n.items[0].id });
  const close = useCallback(() => setOverlay(null), []);

  if (fatal)
    return (
      <main className="fatal">
        <h1>يَمان</h1>
        <p>تعذّر فتح التخزين المحلي في هذا المتصفح. جرّبي نافذة عادية غير خاصة، أو متصفحًا آخر.</p>
      </main>
    );

  return (
    <MotionConfig reducedMotion="user">
      {phase !== 'garden' && <Intro grown={grown} onEnter={enter} />}
      {phase !== 'intro' && ready && (
        <motion.div
          className="garden-layer"
          initial={phase === 'entering' ? { clipPath: 'circle(0% at 50% 58%)' } : { opacity: 0 }}
          animate={phase === 'entering' ? { clipPath: 'circle(150% at 50% 58%)' } : { opacity: 1 }}
          transition={{ duration: phase === 'entering' ? 1.6 : 0.6, ease: [0.5, 0, 0.2, 1] }}
          onAnimationComplete={() => phase === 'entering' && setPhase('garden')}
        >
          <Garden
            memories={memories}
            birth={birth}
            fresh={fresh}
            onOpen={open}
            onAdd={() => (setAddDate(undefined), setOverlay('add'))}
            onMenu={() => setOverlay('menu')}
            onDiscover={() => setOverlay('discover')}
            onTimeline={() => setOverlay('timeline')}
            onLetters={() => setOverlay('letters')}
            onMemories={() => (sorted.length ? setOverlay({ view: sorted[sorted.length - 1].id }) : (setAddDate(undefined), setOverlay('add')))}
          />
        </motion.div>
      )}

      <AnimatePresence>
        {overlay === 'add' && <AddMemory key="add" birth={birth} initialDate={addDate} onClose={close} onSave={save} />}
        {overlay === 'letters' && <Letters key="letters" birth={birth} onClose={close} />}
        {overlay === 'timeline' && (
          <Timeline
            key="timeline"
            memories={memories}
            birth={birth}
            onClose={close}
            onAdd={(d) => (setAddDate(d), setOverlay('add'))}
            onBirth={() => setOverlay('menu')}
          />
        )}
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
        {overlay === 'discover' && <Discover key="discover" list={sorted} birth={birth} onClose={close} onAdd={() => (setAddDate(undefined), setOverlay('add'))} />}
        {viewIndex >= 0 && (
          <Viewer key="viewer" list={sorted} index={viewIndex} birth={birth} onIndex={(i) => setOverlay({ view: sorted[i].id })} onClose={close} onDelete={remove} />
        )}
      </AnimatePresence>

      <div className="toast" role="status" aria-live="polite">{toast}</div>
    </MotionConfig>
  );
}



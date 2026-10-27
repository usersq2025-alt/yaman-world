import GardenScene from './GardenScene';
import Icon from './Icons';
import type { Memory } from '../types';
import type { Node } from '../lib/layout';
import { ageText, memoriesLabel, todayStr } from '../lib/format';

interface Props {
  memories: Memory[];
  birth: string | null;
  fresh: Set<string>;
  onOpen: (n: Node) => void;
  onAdd: () => void;
  onMenu: () => void;
  onDiscover: () => void;
  onTimeline: () => void;
  onLetters: () => void;
  onMemories: () => void;
}

export default function Garden({ memories, birth, fresh, onOpen, onAdd, onMenu, onDiscover, onTimeline, onLetters, onMemories }: Props) {
  const age = birth ? ageText(birth, todayStr()) : null;
  const real = memories.filter((m) => !m.demo).length;
  return (
    <main className="garden">
      <GardenScene memories={memories} fresh={fresh} onOpen={onOpen} onMemories={onMemories} onLetters={onLetters} onTimeline={onTimeline} onDiscover={onDiscover} />

      <header className="g-top">
        <h1 className="g-title">عالم يمان</h1>
        {age ? (
          <p className="g-sub">{age === 'يوم الميلاد' ? 'اليوم يوم ميلاده' : `عمره الآن ${age}`}</p>
        ) : (
          <button className="g-sub g-pill" onClick={onMenu}>أضيفي تاريخ ميلاد يمان</button>
        )}
        <button className="round menu-btn" onClick={onMenu} aria-label="القائمة">
          <Icon name="menu" />
        </button>
      </header>

      <button className="g-note" onClick={onMenu}>
        {memoriesLabel(memories.length)}
        {memories.length > 0 && real === 0 && ' · تجريبية'}
        <span> · على هذا الجهاز فقط</span>
      </button>

      <button className="round fab" onClick={onAdd} aria-label="أضيفي ذكرى">
        <Icon name="plus" size={30} />
      </button>
    </main>
  );
}


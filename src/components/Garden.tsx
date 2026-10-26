import Tree from './Tree';
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
}

export default function Garden({ memories, birth, fresh, onOpen, onAdd, onMenu, onDiscover, onTimeline, onLetters }: Props) {
  const age = birth ? ageText(birth, todayStr()) : null;
  const real = memories.filter((m) => !m.demo).length;
  return (
    <main className="garden">
      <header className="g-head">
        <div>
          <h1 className="g-name">يَمان</h1>
          {age ? (
            <p className="g-age">{age === 'يوم الميلاد' ? 'اليوم يوم ميلاده' : `عمره الآن ${age}`}</p>
          ) : (
            <button className="link small" onClick={onMenu}>أضيفي تاريخ ميلاد يمان</button>
          )}
        </div>
        <div className="g-tools">
          <button className="link" onClick={onTimeline}>رحلة يمان</button>
          <button className="link" onClick={onLetters}>الرسائل</button>
          <button className="icon-btn" onClick={onMenu} aria-label="القائمة">
            <Icon name="menu" />
          </button>
        </div>
      </header>

      <div className="g-stage">
        <Tree memories={memories} fresh={fresh} onOpen={onOpen} />
        {memories.length === 0 && <p className="g-empty">الشجرة تنتظر أول ذكرى</p>}
      </div>

      <footer className="g-foot">
        <p className="g-count">
          {memoriesLabel(memories.length)}
          {memories.length > 0 && real === 0 && ' · تجريبية'}
          <button className="link small" onClick={onMenu}>محفوظة على هذا الجهاز فقط</button>
        </p>
        <div className="g-actions">
          <button className="primary add" onClick={onAdd}>
            <Icon name="plus" size={22} /> أضيفي ذكرى
          </button>
          <button className="ghost" onClick={onDiscover}>
            <Icon name="sparkle" size={20} /> ذكرى تنتظركِ
          </button>
        </div>
      </footer>
    </main>
  );
}


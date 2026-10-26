import { motion } from 'motion/react';
import { useEffect, useRef, type ReactNode } from 'react';
import Icon from './Icons';

export default function Sheet({ title, onClose, children, closeLabel = 'إغلاق' }: { title: string; onClose: () => void; children: ReactNode; closeLabel?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => {
      window.removeEventListener('keydown', k);
      prev?.focus?.();
    };
  }, [onClose]);
  return (
    <motion.div className="scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="sheet"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 280 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-head">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label={closeLabel}>
            <Icon name="close" />
          </button>
        </div>
        <div className="sheet-body">{children}</div>
      </motion.div>
    </motion.div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { repo } from '../data';
import { todayStr } from '../lib/format';
import Sheet from './Sheet';
import DateField from './DateField';
import Icon from './Icons';

interface Props {
  birth: string | null;
  hasDemos: boolean;
  onBirth: (d: string | null) => void;
  onClose: () => void;
  onRemoveDemos: () => void;
  onImported: (n: number) => void;
  onReplayIntro: () => void;
}

export default function Menu({ birth, hasDemos, onBirth, onClose, onRemoveDemos, onImported, onReplayIntro }: Props) {
  const file = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [space, setSpace] = useState('');
  useEffect(() => {
    navigator.storage?.estimate?.().then((e) => {
      if (e.usage == null || !e.quota) return;
      const mb = (n: number) => Math.round(n / 1048576).toLocaleString('en-US');
      setSpace(`المستخدم الآن ${mb(e.usage)} ميغابايت من نحو ${mb(e.quota)}.`);
    }).catch(() => {});
  }, []);

  const doExport = async () => {
    setBusy(true);
    setMsg('');
    try {
      const blob = await repo.exportBackup();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `alam-yaman-${todayStr()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      setMsg('تم تنزيل ملف النسخة. احتفظي به في مكان آمن خارج هذا الجهاز.');
    } catch {
      setMsg('تعذّر إنشاء النسخة.');
    }
    setBusy(false);
  };

  const doImport = async (f: File | undefined) => {
    if (!f) return;
    setBusy(true);
    setMsg('');
    try {
      const n = await repo.importBackup(f);
      onImported(n);
      setMsg(n ? 'تم استرجاع الذكريات من الملف.' : 'لا توجد ذكريات جديدة في هذا الملف.');
    } catch {
      setMsg('هذا الملف ليس نسخة صالحة من عالم يمان.');
    }
    if (file.current) file.current.value = '';
    setBusy(false);
  };

  return (
    <Sheet title="القائمة" onClose={onClose}>
      <section className="group">
        <h3>تاريخ ميلاد يمان</h3>
        <p className="hint">يُستخدم لإظهار عمر يمان في كل ذكرى. لم أضع أي تاريخ من عندي.</p>
        <DateField label="" value={birth ?? ''} max={todayStr()} placeholder="اختاري تاريخ الميلاد" onChange={(d) => onBirth(d || null)} />
        {birth && <button className="link small" onClick={() => onBirth(null)}>مسح التاريخ</button>}
      </section>

      <section className="group">
        <h3>النسخة الاحتياطية</h3>
        <p className="hint">الذكريات محفوظة الآن على هذا المتصفح وهذا الجهاز فقط. هذا ليس نسخًا احتياطيًا دائمًا: مسح بيانات المتصفح أو فقدان الجهاز يعني فقدانها. لا توجد مزامنة سحابية بعد، فصدّري نسخة بانتظام.</p>
        <div className="row wrap">
          <button className="primary" onClick={doExport} disabled={busy}><Icon name="download" size={20} /> تصدير الذكريات</button>
          <button className="ghost" onClick={() => file.current?.click()} disabled={busy}><Icon name="upload" size={20} /> استرجاع من ملف</button>
          <input ref={file} type="file" accept="application/json,.json" hidden onChange={(e) => doImport(e.target.files?.[0])} />
        </div>
        {space && <p className="hint">{space}</p>}
        {msg && <p className="note" role="status">{msg}</p>}
      </section>

      {hasDemos && (
        <section className="group">
          <h3>الذكريات التجريبية</h3>
          <p className="hint">رسومات نباتية وضعتها لتري شكل التجربة. لا تخصّ يمان.</p>
          <button className="ghost" onClick={onRemoveDemos}><Icon name="trash" size={20} /> حذف الذكريات التجريبية</button>
        </section>
      )}

      <button className="link" onClick={onReplayIntro}>إعادة مشاهدة الافتتاحية</button>
    </Sheet>
  );
}




const pad = (n: number) => String(n).padStart(2, '0');

export function toStr(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
export const todayStr = () => toStr(new Date());
export const parse = (s: string) => new Date(`${s}T00:00:00`);
export function addDays(s: string, n: number): string {
  const d = parse(s);
  d.setDate(d.getDate() + n);
  return toStr(d);
}

const dateFmt = new Intl.DateTimeFormat('ar-u-ca-gregory-nu-arab', { day: 'numeric', month: 'long', year: 'numeric' });
const monthFmt = new Intl.DateTimeFormat('ar-u-ca-gregory-nu-arab', { month: 'long', year: 'numeric' });
export const formatDate = (s: string) => dateFmt.format(parse(s));
export const formatMonth = (s: string) => monthFmt.format(parse(s));
export const num = (n: number) => n.toLocaleString('ar-EG');

/** Arabic counted noun: [one, two, few(3-10), many(11+)] */
function counted(n: number, f: [string, string, string, string]): string {
  if (n === 1) return f[0];
  if (n === 2) return f[1];
  return n <= 10 ? `${num(n)} ${f[2]}` : `${num(n)} ${f[3]}`;
}

export const memoriesLabel = (n: number) =>
  n === 0 ? 'لا ذكريات بعد' : counted(n, ['ذكرى واحدة', 'ذكريان', 'ذكريات', 'ذكرى']);

/** Whole years/months/days between two YYYY-MM-DD dates (to >= from). */
export function span(from: string, to: string) {
  const a = parse(from);
  const b = parse(to);
  let y = b.getFullYear() - a.getFullYear();
  let m = b.getMonth() - a.getMonth();
  let d = b.getDate() - a.getDate();
  if (d < 0) {
    d += new Date(b.getFullYear(), b.getMonth(), 0).getDate();
    m -= 1;
  }
  if (m < 0) {
    m += 12;
    y -= 1;
  }
  return { y, m, d };
}

export function ageText(birth: string, at: string): string | null {
  if (at < birth) return null;
  const { y, m, d } = span(birth, at);
  const parts: string[] = [];
  if (y) parts.push(counted(y, ['سنة', 'سنتان', 'سنوات', 'سنة']));
  if (m) parts.push(counted(m, ['شهر', 'شهران', 'أشهر', 'شهرًا']));
  if (d) parts.push(counted(d, ['يوم', 'يومان', 'أيام', 'يومًا']));
  return parts.length ? parts.join(' و') : 'يوم الميلاد';
}

export const daysUntil = (s: string) => Math.round((parse(s).getTime() - parse(todayStr()).getTime()) / 86400000);

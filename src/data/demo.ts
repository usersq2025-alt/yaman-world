import type { Memory } from '../types';
import { addDays, todayStr } from '../lib/format';

/** Botanical illustration used instead of photos; clearly not a picture of the child. */
function scene(v: number): string {
  const bg = ['#F3ECE0', '#E3EAE2', '#E6ECEE', '#F1E8D8'][v % 4];
  const leaf = (x: number, y: number, r: number, k: number, c: string) =>
    `<g transform="translate(${x} ${y}) rotate(${r}) scale(${k})"><path d="M0 0C28 -22 28 -62 0 -84C-28 -62 -28 -22 0 0Z" fill="${c}"/><path d="M0 -4V-70" stroke="#F8F5EF" stroke-opacity=".55" stroke-width="2"/></g>`;
  const stems = [
    `<path d="M400 600C396 520 408 440 400 340" stroke="#405A48" stroke-width="7" fill="none" stroke-linecap="round"/>${leaf(398, 520, -55, 1, '#A8B8A0')}${leaf(402, 470, 55, 1.1, '#405A48')}${leaf(399, 410, -50, 1.2, '#A8B8A0')}${leaf(401, 360, 48, 1.3, '#405A48')}${leaf(400, 345, 0, 1.2, '#A8B8A0')}`,
    `<path d="M400 600C440 520 380 430 430 330" stroke="#405A48" stroke-width="7" fill="none" stroke-linecap="round"/>${leaf(418, 520, 60, 1.2, '#A8B8A0')}${leaf(405, 470, -60, 1, '#B9C7CC')}${leaf(410, 410, 55, 1.3, '#405A48')}${leaf(430, 335, 10, 1.3, '#A8B8A0')}<circle cx="470" cy="300" r="14" fill="#C9A86A"/>`,
    `<path d="M400 600C400 500 330 460 300 380M400 560C410 480 480 440 520 370" stroke="#405A48" stroke-width="6" fill="none" stroke-linecap="round"/>${leaf(330, 440, -70, 1.1, '#A8B8A0')}${leaf(300, 385, -20, 1.2, '#405A48')}${leaf(480, 440, 70, 1.1, '#B9C7CC')}${leaf(520, 375, 20, 1.3, '#A8B8A0')}`,
    `<path d="M400 600C392 520 412 430 400 320" stroke="#405A48" stroke-width="7" fill="none" stroke-linecap="round"/>${leaf(396, 500, -58, 1.3, '#405A48')}${leaf(404, 440, 58, 1.3, '#A8B8A0')}${[0, 60, 120, 180, 240, 300].map((a) => `<ellipse cx="400" cy="280" rx="14" ry="34" transform="rotate(${a} 400 316) translate(0 -34)" fill="#E8DCCB" stroke="#405A48" stroke-opacity=".35"/>`).join('')}<circle cx="400" cy="316" r="16" fill="#C9A86A"/>`,
  ][v % 4];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><rect width="800" height="600" fill="${bg}"/><circle cx="400" cy="330" r="210" fill="#F8F5EF" fill-opacity=".6"/><ellipse cx="400" cy="590" rx="260" ry="26" fill="#E8DCCB"/>${stems}</svg>`;
}

const NOTES = [
  'هكذا تظهر الذكرى: صورة، وتاريخ، ووصف بكلماتكِ.',
  'يمكنكِ إضافة أكثر من ذكرى في اليوم نفسه.',
  'ورقة جديدة تنبت على الشجرة مع كل ذكرى تحفظينها.',
  'احذفي الذكريات التجريبية متى شئتِ من القائمة.',
];

export function demoMemories(): Memory[] {
  const offsets = [-96, -63, -31, -6];
  const now = todayStr();
  return offsets.map((o, i) => ({
    id: `demo-${i + 1}`,
    kind: 'image' as const,
    date: addDays(now, o),
    text: NOTES[i],
    createdAt: Date.now() + i,
    demo: true,
    svg: scene(i),
  }));
}

/** Says what actually went wrong. "Storage full" is only claimed when the browser reports a quota error. */
export function storageErrorMessage(e: unknown): string {
  const name = e instanceof Error ? e.name : typeof e === 'object' && e && 'name' in e ? String((e as { name: unknown }).name) : '';
  if (name === 'QuotaExceededError')
    return 'مساحة التخزين المتاحة للمتصفح ممتلئة فعلًا. صدّري نسخة من ذكرياتكِ من القائمة ثم احذفي ما لا تحتاجينه، أو جرّبي ملفًا أصغر.';
  if (name === 'SecurityError' || name === 'InvalidStateError')
    return 'المتصفح يمنع التخزين في هذه النافذة (غالبًا نافذة خاصة). افتحي الصفحة في نافذة عادية.';
  return `تعذّر الحفظ (${name || 'خطأ غير معروف'}). جرّبي مرة أخرى، وإن تكرر فأخبريني بهذا الاسم.`;
}

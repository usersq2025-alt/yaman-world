import bg from '../assets/bg/growth.webp';

/** Opening page: the sapling picture is the backdrop, the words and the button are real text. */
export default function Intro({ grown, onEnter }: { grown: boolean; onEnter: () => void }) {
  return (
    <main className="intro">
      <div className="intro-frame">
        <img className={`intro-bg ${grown ? 'grown' : ''}`} src={bg} alt="" aria-hidden="true" />
        <div className="intro-veil" aria-hidden="true" />
        <div className="intro-inner">
          <div className="intro-text">
            <h1 className="name">يَمان</h1>
            <p className="sub">حكاية البركة الصغيرة</p>
            <p className="line1">منذ أن جاء يَمان، بدأت حكاية جميلة.</p>
            <p className="line2">هنا ستبقى ضحكاته الأولى، وصوره، ولحظاته الصغيرة… لتكبر الحكاية معه يومًا بعد يوم.</p>
          </div>
          <button className="primary enter" onClick={onEnter} disabled={grown}>
            ادخلي إلى عالم يمان
          </button>
        </div>
      </div>
    </main>
  );
}

import styles from './WeatherInQenaHero.module.css';

/**
 * Animated typographic hero for /guide/qena/weather-in-qena (wp-page-60321),
 * recreated from the owner's design handoff (2026-07-05): navy Cormorant
 * wordmark on a cream field, a gold line-art sun whose rays rotate (40s) and
 * whose disc breathes (4s), and a gold breeze glyph with a navy sparkle.
 * Both animations stop under prefers-reduced-motion.
 *
 * Decorative: the page's real <h1> carries the title below, so the whole
 * hero is aria-hidden.
 */
export default function WeatherInQenaHero() {
  return (
    <div className={styles.hero} aria-hidden="true">
      {/* Sun — rays rotate slowly; core disc breathes */}
      <svg className={styles.sun} viewBox="0 0 100 100">
        <g className={styles.rays}>
          <g stroke="#c19a4b" strokeWidth="1.6" strokeLinecap="round">
            <line x1="50" y1="6" x2="50" y2="20" />
            <line x1="50" y1="80" x2="50" y2="94" />
            <line x1="6" y1="50" x2="20" y2="50" />
            <line x1="80" y1="50" x2="94" y2="50" />
            <line x1="19" y1="19" x2="29" y2="29" />
            <line x1="71" y1="71" x2="81" y2="81" />
            <line x1="81" y1="19" x2="71" y2="29" />
            <line x1="29" y1="71" x2="19" y2="81" />
            <line x1="34" y1="8" x2="39" y2="21" />
            <line x1="61" y1="79" x2="66" y2="92" />
            <line x1="66" y1="8" x2="61" y2="21" />
            <line x1="39" y1="79" x2="34" y2="92" />
            <line x1="8" y1="34" x2="21" y2="39" />
            <line x1="79" y1="61" x2="92" y2="66" />
            <line x1="8" y1="66" x2="21" y2="61" />
            <line x1="79" y1="39" x2="92" y2="34" />
          </g>
        </g>
        <circle
          className={styles.disc}
          cx="50"
          cy="50"
          r="18"
          fill="none"
          stroke="#c19a4b"
          strokeWidth="1.8"
        />
      </svg>

      {/* Wordmark */}
      <div className={styles.wordmark}>
        <div className={styles.big}>Weather</div>
        <div className={styles.row}>
          <span className={styles.in}>in</span>
          <span className={styles.big}>Qena</span>
        </div>
      </div>

      {/* Breeze strokes + sparkle */}
      <svg className={styles.wind} viewBox="0 0 120 82">
        <g fill="none" stroke="#c19a4b" strokeWidth="1.6" strokeLinecap="round">
          <path d="M6 20 H70 a9 9 0 1 0 -9 -9" />
          <path d="M14 34 H92 a8 8 0 1 1 -8 8" />
          <path d="M6 48 H74 a9 9 0 1 0 -9 9" />
        </g>
        <path d="M40 68 l3 7 l7 3 l-7 3 l-3 7 l-3 -7 l-7 -3 l7 -3 z" fill="#12345a" />
      </svg>
    </div>
  );
}

/**
 * The fixed ambient canvas the whole app floats over. Three slow-drifting,
 * heavily-blurred blobs kept to a whisper so chrome stays calm.
 *
 * Warm on purpose — saffron, rose and amber gold. It should read as devotional
 * warmth, not the cyan/violet gradient that signals "an AI made this".
 *
 * Mounted first inside <body> so it sits behind everything at z-index -1.
 * Purely decorative, so it is hidden from assistive tech and drops out
 * entirely under prefers-reduced-transparency (see globals.css).
 */
const LiquidBackdrop = () => (
  <div className="liquid-backdrop" aria-hidden="true">
    <div className="liquid-backdrop-blob liquid-blob-a" />
    <div className="liquid-backdrop-blob liquid-blob-b" />
    <div className="liquid-backdrop-blob liquid-blob-c" />
  </div>
);

export default LiquidBackdrop;

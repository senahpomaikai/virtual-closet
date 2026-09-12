import type { Screen } from '../types'

interface Props {
  onNavigate: (screen: Screen) => void
  itemCount: number
}

/**
 * Screen 1. The headline is the one thing a first-time viewer must register, so it
 * gets the largest type on the screen, the only italic, and the top of the reading
 * order. The background animation sits at 9% opacity behind everything and freezes
 * entirely under prefers-reduced-motion — it illustrates the capability, it does not
 * compete for attention.
 */
export default function Landing({ onNavigate, itemCount }: Props) {
  return (
    <div className="landing">
      <BackdropStage />

      <div className="landing__inner">
        <div className="landing__mark">
          <span className="landing__glyph" aria-hidden="true" />
          <span>Virtual Closet</span>
        </div>

        <h1 className="landing__headline">
          Photograph an outfit. Your closet <em>catalogs itself</em>.
        </h1>

        <p className="landing__sub">
          Every piece gets logged with what you paid, how many times you have worn it, and what
          each wear actually costs — so you curate on evidence instead of memory.
        </p>

        <div className="landing__actions">
          <button className="btn btn--lg btn--primary" onClick={() => onNavigate('capture')}>
            Log an Outfit
          </button>
          <button className="btn btn--lg" onClick={() => onNavigate('closet')}>
            View My Closet <span aria-hidden="true">·</span> {itemCount}
          </button>
        </div>
      </div>

      <p className="landing__foot">
        Prototype. The camera runs entirely in your browser and nothing is uploaded.
      </p>
    </div>
  )
}

/**
 * Two states on a 16-second cycle: a garment being scanned into attributes, then a
 * closet of logged pieces drifting past. Muted, low-contrast, decorative only.
 */
function BackdropStage() {
  return (
    <div className="landing__stage" aria-hidden="true">
      <svg viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid slice">
        {/* State A — scan a garment into attributes */}
        <g className="stage-layer stage-layer--a">
          <g transform="translate(720 130) scale(1.55)">
            <path
              d="M70 40 L44 52 L28 152 L54 162 L64 104 L64 224 L136 224 L136 104 L146 162 L172 152 L156 52 L130 40 C120 54 80 54 70 40 Z"
              fill="none"
              stroke="#2b2522"
              strokeWidth="2"
            />
            <g className="scanline">
              <rect x="10" y="30" width="180" height="3" fill="#a8766c" />
            </g>
          </g>
          <g stroke="#2b2522" strokeWidth="2" fill="none" transform="translate(560 205)">
            <rect x="150" y="250" width="230" height="48" />
            <rect x="150" y="320" width="180" height="48" />
            <rect x="150" y="390" width="260" height="48" />
            <path d="M380 274 L620 274" />
            <path d="M330 344 L620 344" />
            <path d="M410 414 L620 414" />
          </g>
        </g>

        {/* State B — the closet it accumulates into */}
        <g className="stage-layer stage-layer--b">
          <g className="carousel" stroke="#2b2522" strokeWidth="2" fill="none">
            {Array.from({ length: 12 }).map((_, index) => (
              <g key={index} transform={`translate(${index * 160} 0)`}>
                <rect x="60" y={index % 2 ? 210 : 160} width="120" height={index % 2 ? 260 : 320} />
                <path
                  d={`M60 ${(index % 2 ? 210 : 160) + (index % 2 ? 195 : 240)} L180 ${
                    (index % 2 ? 210 : 160) + (index % 2 ? 195 : 240)
                  }`}
                />
              </g>
            ))}
          </g>
        </g>
      </svg>
    </div>
  )
}

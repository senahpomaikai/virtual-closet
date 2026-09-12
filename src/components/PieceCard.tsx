import { CATEGORIES, type Category, type DetectedPiece } from '../types'
import { COLOR_NAMES, contrastInk } from '../lib/color'
import { ACCESSORY_TYPES, MATERIALS, sizesForCategory } from '../lib/guess'

interface Props {
  piece: DetectedPiece
  onChange: (patch: Partial<DetectedPiece>) => void
  onDecideMatch: (samePiece: boolean) => void
  onToggleDismiss: () => void
}

/**
 * One detected piece, with every guess pre-filled and every field overridable.
 * Chips label where each value came from: colour is measured off the pixels, the
 * rest are suggestions. Saying so up front is the honest version of "AI guessed it"
 * and keeps the user from trusting a placeholder size.
 */
export default function PieceCard({ piece, onChange, onDecideMatch, onToggleDismiss }: Props) {
  const sizes = sizesForCategory(piece.category)

  return (
    <div className={`piece${piece.dismissed ? ' piece--dismissed' : ''}`}>
      <div className="piece__head">
        <img className="piece__thumb" src={piece.image} alt={`Detected ${piece.name}`} />
        <div className="piece__headings">
          <span className="piece__region">{piece.source}</span>
          <h3 className="piece__name">{piece.name}</h3>
          <button className="btn btn--ghost" onClick={onToggleDismiss}>
            {piece.dismissed ? 'Put this one back' : 'Not a garment — remove'}
          </button>
        </div>
      </div>

      {piece.match && (
        <div className="match">
          {piece.matchDecision === null ? (
            <>
              <span>
                Looks similar to <strong>{piece.match.itemName}</strong> — same piece?
              </span>
              <div className="match__actions">
                <button className="btn btn--primary" onClick={() => onDecideMatch(true)}>
                  Yes, log a wear
                </button>
                <button className="btn" onClick={() => onDecideMatch(false)}>
                  No, it is new
                </button>
              </div>
            </>
          ) : (
            <span className="match__resolved">
              {piece.matchDecision
                ? `Logging a wear on ${piece.match.itemName}.`
                : 'Saving as a new item.'}{' '}
              <button className="btn btn--ghost" onClick={() => onDecideMatch(!piece.matchDecision)}>
                Change
              </button>
            </span>
          )}
        </div>
      )}

      {!piece.dismissed && piece.matchDecision !== true && (
        <>
          <label className="field">
            <span className="field__label">Name this piece</span>
            <input
              value={piece.name}
              onChange={(event) => onChange({ name: event.target.value, nameEdited: true })}
              placeholder="e.g. The good black blazer"
            />
          </label>

          <div className="field--row">
            <label className="field">
              <span className="field__label">Brand</span>
              <input
                value={piece.brand}
                onChange={(event) => onChange({ brand: event.target.value })}
                placeholder="Optional"
              />
            </label>

            <label className="field">
              <span className="field__label">Date purchased</span>
              <input
                type="date"
                value={piece.purchaseDate}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(event) => onChange({ purchaseDate: event.target.value })}
              />
            </label>
          </div>

          <label className="field">
            <span className="field__label">
              Category <span className="chip chip--guess">from framing</span>
            </span>
            <select
              value={piece.category}
              onChange={(event) => onChange({ category: event.target.value as Category })}
            >
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span className="field__label">
              Type <span className="chip chip--guess">guess</span>
            </span>
            <input
              value={piece.type}
              list={piece.category === 'Accessories' ? 'accessory-types' : undefined}
              onChange={(event) => onChange({ type: event.target.value })}
              placeholder="e.g. Crewneck sweater"
            />
            <datalist id="accessory-types">
              {ACCESSORY_TYPES.map((type) => (
                <option key={type} value={type} />
              ))}
            </datalist>
          </label>

          <div className="field">
            <span className="field__label">
              Colour <span className="chip chip--measured">measured</span>
            </span>
            <div className="swatch-row">
              <span
                className="swatch"
                style={{ background: piece.colorHex, color: contrastInk(piece.colorHex) }}
                title={piece.colorHex}
              />
              <select
                value={piece.color}
                onChange={(event) => onChange({ color: event.target.value })}
                aria-label="Colour"
              >
                {COLOR_NAMES.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="field--row">
            <label className="field">
              <span className="field__label">
                Material <span className="chip chip--guess">guess</span>
              </span>
              <select
                value={piece.material}
                onChange={(event) => onChange({ material: event.target.value })}
              >
                {Array.from(new Set([piece.material, ...MATERIALS])).map((material) => (
                  <option key={material} value={material}>
                    {material}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span className="field__label">
                Size <span className="chip chip--guess">guess</span>
              </span>
              <select value={piece.size} onChange={(event) => onChange({ size: event.target.value })}>
                {Array.from(new Set([piece.size, ...sizes, 'One size'])).map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="field">
            <span className="field__label">What you paid</span>
            <input
              type="number"
              min={0}
              step={1}
              value={piece.price || ''}
              onChange={(event) => onChange({ price: Number(event.target.value) || 0 })}
              placeholder="Needed for cost per wear"
            />
          </label>
        </>
      )}
    </div>
  )
}

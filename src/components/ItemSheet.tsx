import { useEffect } from 'react'
import { costPerWear, formatMoney, type ClosetItem } from '../types'

interface Props {
  item: ClosetItem
  onClose: () => void
  onLogWear: () => void
}

/** Tap-to-expand detail. Spells out the arithmetic behind cost per wear. */
export default function ItemSheet({ item, onClose, onLogWear }: Props) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const cpw = costPerWear(item)

  return (
    <div className="sheet" role="dialog" aria-modal="true" aria-label={item.name} onClick={onClose}>
      <div className="sheet__panel" onClick={(event) => event.stopPropagation()}>
        <button className="sheet__close" onClick={onClose} aria-label="Close">
          ×
        </button>

        <div className="sheet__top">
          <img src={item.image} alt={item.name} />
          <div>
            <h3 className="sheet__title">{item.name}</h3>
            <p className="eyebrow">{item.category}</p>
          </div>
        </div>

        <dl className="spec">
          <div>
            <dt>Type</dt>
            <dd>{item.type}</dd>
          </div>
          <div>
            <dt>Material</dt>
            <dd>{item.material}</dd>
          </div>
          <div>
            <dt>Colour</dt>
            <dd>{item.color}</dd>
          </div>
          <div>
            <dt>Size</dt>
            <dd>{item.size}</dd>
          </div>
          <div>
            <dt>Paid</dt>
            <dd>{item.price ? formatMoney(item.price) : 'Not recorded'}</dd>
          </div>
          <div>
            <dt>Times worn</dt>
            <dd>{item.numWear}</dd>
          </div>
        </dl>

        <p className="capture__note">
          {cpw === null
            ? 'Add what you paid to see a cost per wear.'
            : `${formatMoney(item.price)} ÷ ${item.numWear} ${item.numWear === 1 ? 'wear' : 'wears'} = ${formatMoney(cpw)} per wear.`}
        </p>

        <div className="sheet__wear">
          <button className="btn btn--primary" onClick={onLogWear}>
            Log a wear
          </button>
          <span className="saveline__count">Every wear drives the cost down.</span>
        </div>
      </div>
    </div>
  )
}

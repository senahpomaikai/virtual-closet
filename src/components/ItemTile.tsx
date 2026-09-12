import { costPerWear, formatMoney, type ClosetItem } from '../types'

interface Props {
  item: ClosetItem
  /** Taller tile — the uneven rhythm is what makes the grid read as bento rather than a table. */
  tall: boolean
  justLogged: boolean
  onOpen: () => void
}

export default function ItemTile({ item, tall, justLogged, onOpen }: Props) {
  const cpw = costPerWear(item)

  return (
    <button className={`tile${tall ? ' tile--tall' : ''}`} onClick={onOpen}>
      <img src={item.image} alt={item.name} />
      <span className="tile__body">
        <span className="tile__meta">
          {justLogged ? 'Just logged' : item.category}
        </span>
        <span className="tile__name">{item.name}</span>
        <span className="tile__metrics">
          <span className="tile__cpw">
            {cpw === null ? '—' : formatMoney(cpw)} <span>/ wear</span>
          </span>
          <span className="tile__wears">{item.numWear}×</span>
        </span>
      </span>
    </button>
  )
}

import { useMemo, useState } from 'react'
import { formatMoney, type Category, type ClosetItem, type Screen } from '../types'
import { applyFilters, availableValues, closetStats, NO_FILTERS, type Filters } from '../lib/closet'
import { hexForColorName } from '../lib/color'
import TopBar from '../components/TopBar'
import ItemTile from '../components/ItemTile'
import ItemSheet from '../components/ItemSheet'

interface Props {
  items: ClosetItem[]
  justLogged: string[]
  onNavigate: (screen: Screen) => void
  onLogWear: (id: string) => void
  onReset: () => void
}

/**
 * Screen 3. The payoff screen, so the metrics carry the layout: a stat strip for the
 * whole closet, then per-item cost per wear on every tile.
 *
 * Gestalt: the filters live inside one bordered, tinted block (common region) so they
 * read as controls rather than content. Inside that block each facet is its own labelled
 * row (proximity), and every control is the same pill (similarity). The grid below uses
 * a single repeated tile shape, with the two metrics fenced off by a rule so they group
 * together rather than trailing off the name.
 */
export default function Closet({ items, justLogged, onNavigate, onLogWear, onReset }: Props) {
  const [filters, setFilters] = useState<Filters>(NO_FILTERS)
  const [openId, setOpenId] = useState<string | null>(null)

  const sorted = useMemo(() => [...items].sort((a, b) => b.addedAt - a.addedAt), [items])
  const visible = useMemo(() => applyFilters(sorted, filters), [sorted, filters])
  const values = useMemo(() => availableValues(items), [items])
  const stats = useMemo(() => closetStats(items), [items])
  const open = openId ? items.find((item) => item.id === openId) ?? null : null
  const filtered = filters !== NO_FILTERS && visible.length !== items.length

  return (
    <>
      <TopBar title="My Closet" onHome={() => onNavigate('landing')}>
        <button className="btn" onClick={() => onNavigate('capture')}>
          Log an Outfit
        </button>
      </TopBar>

      <main className="page">
        <div className="closet__head">
          <div>
            <p className="eyebrow">Every piece you own</p>
            <h1>My Closet</h1>
          </div>
          <button className="btn btn--ghost" onClick={onReset}>
            Reset demo closet
          </button>
        </div>

        <div className="stats">
          <div className="stat">
            <span className="stat__value">{stats.itemCount}</span>
            <span className="stat__label">Pieces</span>
          </div>
          <div className="stat">
            <span className="stat__value">{stats.totalWears}</span>
            <span className="stat__label">Wears logged</span>
          </div>
          <div className="stat">
            <span className="stat__value">
              {stats.averageCostPerWear === null ? '—' : formatMoney(stats.averageCostPerWear)}
            </span>
            <span className="stat__label">Average cost per wear</span>
          </div>
          <div className="stat">
            <span className="stat__value">{stats.byCategory.length}</span>
            <span className="stat__label">Categories</span>
          </div>
        </div>

        <section className="filters" aria-label="Filter the closet">
          <div className="filters__head">
            <p className="eyebrow">Filter</p>
            {filtered && (
              <button className="btn btn--ghost" onClick={() => setFilters(NO_FILTERS)}>
                Clear filters
              </button>
            )}
          </div>

          <div className="filters__row">
            <span className="filters__facet">Category</span>
            <Pill
              label="All"
              active={filters.category === 'All'}
              onClick={() => setFilters((f) => ({ ...f, category: 'All' }))}
            />
            {values.categories.map((category) => (
              <Pill
                key={category}
                label={category}
                active={filters.category === category}
                onClick={() => setFilters((f) => ({ ...f, category: category as Category }))}
              />
            ))}
          </div>

          <div className="filters__row">
            <span className="filters__facet">Colour</span>
            <Pill
              label="All"
              active={filters.color === 'All'}
              onClick={() => setFilters((f) => ({ ...f, color: 'All' }))}
            />
            {values.colors.map((color) => (
              <Pill
                key={color}
                label={color}
                swatch={hexForColorName(color)}
                active={filters.color === color}
                onClick={() => setFilters((f) => ({ ...f, color }))}
              />
            ))}
          </div>

          <div className="filters__row">
            <span className="filters__facet">Material</span>
            <Pill
              label="All"
              active={filters.material === 'All'}
              onClick={() => setFilters((f) => ({ ...f, material: 'All' }))}
            />
            {values.materials.map((material) => (
              <Pill
                key={material}
                label={material}
                active={filters.material === material}
                onClick={() => setFilters((f) => ({ ...f, material }))}
              />
            ))}
          </div>
        </section>

        {visible.length === 0 ? (
          <p className="empty">Nothing matches those filters yet.</p>
        ) : (
          <div className="grid">
            {visible.map((item, index) => (
              <ItemTile
                key={item.id}
                item={item}
                tall={index % 5 === 1 || index % 5 === 4}
                justLogged={justLogged.includes(item.id)}
                onOpen={() => setOpenId(item.id)}
              />
            ))}
          </div>
        )}
      </main>

      {open && (
        <ItemSheet
          item={open}
          onClose={() => setOpenId(null)}
          onLogWear={() => onLogWear(open.id)}
        />
      )}
    </>
  )
}

interface PillProps {
  label: string
  active: boolean
  onClick: () => void
  swatch?: string
}

function Pill({ label, active, onClick, swatch }: PillProps) {
  return (
    <button
      className={`pill${swatch ? ' pill--swatch' : ''}`}
      aria-pressed={active}
      onClick={onClick}
    >
      {swatch && <span className="pill__dot" style={{ background: swatch }} aria-hidden="true" />}
      {label}
    </button>
  )
}

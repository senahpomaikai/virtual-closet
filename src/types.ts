export const CATEGORIES = [
  'Tops',
  'Bottoms',
  'Dresses',
  'Outerwear',
  'Shoes',
  'Accessories',
] as const

export type Category = (typeof CATEGORIES)[number]

/** Narrow garment type, e.g. "Crewneck sweater". Free text so the user can override. */
export type GarmentType = string

export interface ClosetItem {
  id: string
  /** Short human label shown on the tile, e.g. "Charcoal wool crewneck". */
  name: string
  category: Category
  type: GarmentType
  /** Named colour, e.g. "Charcoal". */
  color: string
  /** Dominant colour as hex — the value the duplicate heuristic actually compares. */
  colorHex: string
  material: string
  size: string
  /** Purchase price in whole dollars. 0 means unknown. */
  price: number
  numWear: number
  /** Data URI: either a generated silhouette (seed data) or a real camera crop. */
  image: string
  addedAt: number
}

/** One region cropped out of a captured frame, before the user confirms it. */
export interface DetectedPiece {
  id: string
  /** Crop of the captured frame as a data URI. */
  image: string
  colorHex: string
  /** Which attributes came from the guess pipeline rather than the user. */
  guessed: Record<'type' | 'color' | 'material' | 'size', boolean>
  name: string
  category: Category
  type: GarmentType
  color: string
  material: string
  size: string
  price: number
  /** Existing closet item this piece may duplicate, if the heuristic found one. */
  match: { itemId: string; itemName: string; distance: number } | null
  /** null = undecided, true = same piece (log a wear), false = new item. */
  matchDecision: boolean | null
  /** User dropped this piece from the batch. */
  dismissed: boolean
}

export type Screen = 'landing' | 'capture' | 'closet'

export function costPerWear(item: Pick<ClosetItem, 'price' | 'numWear'>): number | null {
  if (!item.price) return null
  if (item.numWear <= 0) return null
  return item.price / item.numWear
}

export function formatMoney(value: number): string {
  return value >= 100 ? `$${Math.round(value)}` : `$${value.toFixed(2)}`
}

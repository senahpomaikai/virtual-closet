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
  /**
   * Label on the tile. Pre-filled from the guessed attributes, e.g. "Charcoal wool
   * crewneck", but the user can rename it to whatever they call the piece.
   */
  name: string
  /** Label on the tag. Empty when the user did not record one. */
  brand: string
  /** ISO date, YYYY-MM-DD. Empty when unknown. */
  purchaseDate: string
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
  /** Once the user renames a piece, stop overwriting it as other fields change. */
  nameEdited: boolean
  brand: string
  purchaseDate: string
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

/** "March 2024" — month precision is all a wardrobe log needs. */
export function formatPurchaseDate(iso: string): string | null {
  if (!iso) return null
  const parsed = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}

export function formatMoney(value: number): string {
  return value >= 100 ? `$${Math.round(value)}` : `$${value.toFixed(2)}`
}

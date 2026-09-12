import { CATEGORIES, costPerWear, type Category, type ClosetItem } from '../types'
import { colorDistance } from './color'

/**
 * Duplicate detection is a heuristic, not recognition: same category plus a
 * perceptually near-identical dominant colour. It will produce false positives and
 * misses, which is why the UI always asks instead of merging silently.
 */
const MATCH_THRESHOLD = 18

export function findMatch(
  candidate: { category: Category; colorHex: string },
  items: ClosetItem[],
): { itemId: string; itemName: string; distance: number } | null {
  let best: { itemId: string; itemName: string; distance: number } | null = null

  for (const item of items) {
    if (item.category !== candidate.category) continue
    const distance = colorDistance(candidate.colorHex, item.colorHex)
    if (distance > MATCH_THRESHOLD) continue
    if (!best || distance < best.distance) {
      best = { itemId: item.id, itemName: item.name, distance }
    }
  }

  return best
}

export interface ClosetStats {
  itemCount: number
  totalWears: number
  /** Mean cost per wear across items that have both a price and at least one wear. */
  averageCostPerWear: number | null
  byCategory: Array<{ category: Category; count: number }>
}

export function closetStats(items: ClosetItem[]): ClosetStats {
  const priced = items
    .map((item) => costPerWear(item))
    .filter((value): value is number => value !== null)

  return {
    itemCount: items.length,
    totalWears: items.reduce((sum, item) => sum + item.numWear, 0),
    averageCostPerWear: priced.length
      ? priced.reduce((sum, value) => sum + value, 0) / priced.length
      : null,
    byCategory: CATEGORIES.map((category) => ({
      category,
      count: items.filter((item) => item.category === category).length,
    })).filter((entry) => entry.count > 0),
  }
}

export interface Filters {
  category: Category | 'All'
  color: string | 'All'
  material: string | 'All'
}

export const NO_FILTERS: Filters = { category: 'All', color: 'All', material: 'All' }

export function applyFilters(items: ClosetItem[], filters: Filters): ClosetItem[] {
  return items.filter((item) => {
    if (filters.category !== 'All' && item.category !== filters.category) return false
    if (filters.color !== 'All' && item.color !== filters.color) return false
    if (filters.material !== 'All' && item.material !== filters.material) return false
    return true
  })
}

/** Only offer filter values the closet actually contains, so no pill leads to an empty grid. */
export function availableValues(items: ClosetItem[]): {
  categories: Category[]
  colors: string[]
  materials: string[]
} {
  const unique = (values: string[]) => Array.from(new Set(values)).sort()
  return {
    categories: CATEGORIES.filter((category) => items.some((item) => item.category === category)),
    colors: unique(items.map((item) => item.color)),
    materials: unique(items.map((item) => item.material)),
  }
}

export function newId(): string {
  return `item-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

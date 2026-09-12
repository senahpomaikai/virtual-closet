import type { ClosetItem } from '../types'

/**
 * Session persistence only — no backend, no auth. localStorage is a convenience so a
 * refresh mid-user-test does not wipe what the participant just logged.
 */
const KEY = 'virtual-closet/items/v1'

export function loadItems(): ClosetItem[] | null {
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed) || parsed.length === 0) return null
    return parsed as ClosetItem[]
  } catch {
    return null
  }
}

export function saveItems(items: ClosetItem[]): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items))
  } catch {
    // Private-mode or full quota: the app still works, it just won't survive a refresh.
  }
}

export function clearItems(): void {
  try {
    window.localStorage.removeItem(KEY)
  } catch {
    // Nothing to do.
  }
}

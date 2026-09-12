import { useCallback, useEffect, useState } from 'react'
import type { ClosetItem, Screen } from './types'
import { seedCloset } from './data/seedCloset'
import { clearItems, loadItems, saveItems } from './lib/storage'
import Landing from './screens/Landing'
import Capture from './screens/Capture'
import Closet from './screens/Closet'

/**
 * Three screens, switched by state rather than URL — the deploy target is S3 behind
 * CloudFront, which does not rewrite deep links the way a Node host would.
 */
export default function App() {
  const [screen, setScreen] = useState<Screen>('landing')
  const [items, setItems] = useState<ClosetItem[]>(() => loadItems() ?? seedCloset())
  /** Items touched by the most recent capture, so Screen 3 can point at them. */
  const [justLogged, setJustLogged] = useState<string[]>([])

  useEffect(() => {
    saveItems(items)
  }, [items])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [screen])

  const commitCapture = useCallback((added: ClosetItem[], wornItemIds: string[]) => {
    setItems((current) => [
      ...added,
      ...current.map((item) =>
        wornItemIds.includes(item.id) ? { ...item, numWear: item.numWear + 1 } : item,
      ),
    ])
    setJustLogged([...added.map((item) => item.id), ...wornItemIds])
  }, [])

  const logWear = useCallback((id: string) => {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, numWear: item.numWear + 1 } : item)),
    )
  }, [])

  const resetCloset = useCallback(() => {
    clearItems()
    setItems(seedCloset())
    setJustLogged([])
  }, [])

  if (screen === 'capture') {
    return <Capture items={items} onCommit={commitCapture} onNavigate={setScreen} />
  }

  if (screen === 'closet') {
    return (
      <Closet
        items={items}
        justLogged={justLogged}
        onNavigate={setScreen}
        onLogWear={logWear}
        onReset={resetCloset}
      />
    )
  }

  return <Landing onNavigate={setScreen} itemCount={items.length} />
}

import type { ReactNode } from 'react'

interface Props {
  title: string
  onHome: () => void
  children?: ReactNode
}

/** Every screen past the landing keeps the same back-to-home control in the same place. */
export default function TopBar({ title, onHome, children }: Props) {
  return (
    <header className="topbar">
      <div className="topbar__inner">
        <button className="topbar__home" onClick={onHome}>
          <span className="topbar__arrow" aria-hidden="true">
            ←
          </span>
          Home
        </button>
        <h2 className="topbar__title">{title}</h2>
        <span className="topbar__spacer" />
        {children}
      </div>
    </header>
  )
}

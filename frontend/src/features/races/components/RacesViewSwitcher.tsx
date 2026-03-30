import styles from './RacesViewSwitcher.module.css'
import type { RacesViewMode } from '../types/racesViewMode'

type RacesViewSwitcherProps = {
  selectedView: RacesViewMode
  onViewChange: (view: RacesViewMode) => void
}

const VIEW_OPTIONS: Array<{ value: RacesViewMode; label: string; text: string }> = [
  { value: 'table', label: 'List view', text: 'List' },
  { value: 'calendar', label: 'Calendar view', text: 'Calendar' },
]

export function RacesViewSwitcher({ selectedView, onViewChange }: RacesViewSwitcherProps) {
  return (
    <div className={styles.switcher} role="tablist" aria-label="Races view selector">
      {VIEW_OPTIONS.map((option) => {
        const isActive = selectedView === option.value

        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-label={option.label}
            title={option.label}
            className={isActive ? `${styles.switchButton} ${styles.switchButtonActive}` : styles.switchButton}
            onClick={() => onViewChange(option.value)}
          >
            <span>{option.text}</span>
          </button>
        )
      })}
    </div>
  )
}

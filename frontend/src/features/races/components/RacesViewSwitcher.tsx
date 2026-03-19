import { faCalendarDays, faTableCellsLarge } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import styles from './RacesViewSwitcher.module.css'
import type { RacesViewMode } from '../types/racesViewMode'

type RacesViewSwitcherProps = {
  selectedView: RacesViewMode
  onViewChange: (view: RacesViewMode) => void
}

const VIEW_OPTIONS: Array<{ value: RacesViewMode; label: string; icon: typeof faCalendarDays }> = [
  { value: 'calendar', label: 'Calendar view', icon: faCalendarDays },
  { value: 'table', label: 'Table view', icon: faTableCellsLarge },
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
            <FontAwesomeIcon icon={option.icon} />
          </button>
        )
      })}
    </div>
  )
}

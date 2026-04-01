import { Segmented } from 'antd'
import type { RacesViewMode } from '../types/racesViewMode'
import styles from './RacesViewSwitcher.module.css'

type RacesViewSwitcherProps = {
  selectedView: RacesViewMode
  onViewChange: (view: RacesViewMode) => void
}

const VIEW_OPTIONS: Array<{ value: RacesViewMode; label: string }> = [
  { value: 'table', label: 'List' },
  { value: 'calendar', label: 'Calendar' },
]

export function RacesViewSwitcher({ selectedView, onViewChange }: RacesViewSwitcherProps) {
  return (
    <Segmented<RacesViewMode>
      value={selectedView}
      onChange={onViewChange}
      options={VIEW_OPTIONS}
      className={styles.segmented}
      aria-label="Races view selector"
    />
  )
}

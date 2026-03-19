import { Select } from 'antd'
import styles from './RacesCalendarModeSwitcher.module.css'
import type { RacesCalendarMode } from '../types/racesCalendarMode'

type RacesCalendarModeSwitcherProps = {
  selectedMode: RacesCalendarMode
  onModeChange: (mode: RacesCalendarMode) => void
}

const OPTIONS = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
] satisfies Array<{ value: RacesCalendarMode; label: string }>

export function RacesCalendarModeSwitcher({
  selectedMode,
  onModeChange,
}: RacesCalendarModeSwitcherProps) {
  return (
    <Select
      value={selectedMode}
      onChange={onModeChange}
      options={OPTIONS}
      className={styles.select}
      aria-label="Calendar view mode"
    />
  )
}

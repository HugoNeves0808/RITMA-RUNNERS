import { Select } from 'antd'
import styles from './RacesCalendarModeSwitcher.module.css'
import type { RacesCalendarMode } from '../types/racesCalendarMode'

type RacesCalendarModeSwitcherProps = {
  selectedMode: RacesCalendarMode
  onModeChange: (mode: RacesCalendarMode) => void
  disabled?: boolean
}

const OPTIONS = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
] satisfies Array<{ value: RacesCalendarMode; label: string }>

export function RacesCalendarModeSwitcher({
  selectedMode,
  onModeChange,
  disabled = false,
}: RacesCalendarModeSwitcherProps) {
  return (
    <Select
      value={selectedMode}
      disabled={disabled}
      onChange={onModeChange}
      options={OPTIONS}
      className={styles.select}
      aria-label="Calendar view mode"
    />
  )
}

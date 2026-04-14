import { Segmented } from 'antd'
import styles from './RacesCalendarModeSwitcher.module.css'
import type { RacesCalendarMode } from '../types/racesCalendarMode'
import { useTranslation } from 'react-i18next'

type RacesCalendarModeSwitcherProps = {
  selectedMode: RacesCalendarMode
  onModeChange: (mode: RacesCalendarMode) => void
  disabled?: boolean
}

export function RacesCalendarModeSwitcher({
  selectedMode,
  onModeChange,
  disabled = false,
}: RacesCalendarModeSwitcherProps) {
  const { t } = useTranslation()
  return (
    <Segmented<RacesCalendarMode>
      value={selectedMode}
      disabled={disabled}
      onChange={onModeChange}
      options={[
        { value: 'monthly', label: t('races.calendarMode.monthly') },
        { value: 'yearly', label: t('races.calendarMode.yearly') },
      ]}
      className={styles.segmented}
      aria-label={t('races.calendarMode.selectorAria')}
    />
  )
}

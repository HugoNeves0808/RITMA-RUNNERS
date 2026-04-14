import { Segmented } from 'antd'
import type { RacesViewMode } from '../types/racesViewMode'
import { useTranslation } from 'react-i18next'
import styles from './RacesViewSwitcher.module.css'

type RacesViewSwitcherProps = {
  selectedView: RacesViewMode
  onViewChange: (view: RacesViewMode) => void
}

export function RacesViewSwitcher({ selectedView, onViewChange }: RacesViewSwitcherProps) {
  const { t } = useTranslation()
  return (
    <Segmented<RacesViewMode>
      value={selectedView}
      onChange={onViewChange}
      options={[
        { value: 'table', label: t('races.view.list') },
        { value: 'calendar', label: t('races.view.calendar') },
      ]}
      className={styles.segmented}
      aria-label={t('races.view.selectorAria')}
    />
  )
}

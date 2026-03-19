import { useState } from 'react'
import { Typography } from 'antd'
import {
  RacesCalendarView,
  RacesCalendarModeSwitcher,
  RacesTableView,
  RacesViewSwitcher,
  type RacesCalendarMode,
  type RacesViewMode,
} from '../../features/races'
import styles from './HomePage.module.css'

const { Title } = Typography

export function HomePage() {
  const [selectedView, setSelectedView] = useState<RacesViewMode>('calendar')
  const [selectedCalendarMode, setSelectedCalendarMode] = useState<RacesCalendarMode>('monthly')

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div className={styles.titleBlock}>
          <Title level={1} className={styles.pageTitle}>Races</Title>
        </div>

        <div className={styles.headerControls}>
          {selectedView === 'calendar' ? (
            <RacesCalendarModeSwitcher
              selectedMode={selectedCalendarMode}
              onModeChange={setSelectedCalendarMode}
            />
          ) : null}

          <RacesViewSwitcher selectedView={selectedView} onViewChange={setSelectedView} />
        </div>
      </div>

      {selectedView === 'calendar'
        ? <RacesCalendarView selectedMode={selectedCalendarMode} onModeChange={setSelectedCalendarMode} />
        : <RacesTableView />}
    </div>
  )
}

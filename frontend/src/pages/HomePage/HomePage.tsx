import { useState } from 'react'
import { Typography } from 'antd'
import {
  RacesCalendarView,
  RacesTableView,
  RacesViewSwitcher,
  type RacesViewMode,
} from '../../features/races'
import styles from './HomePage.module.css'

const { Title } = Typography

export function HomePage() {
  const [selectedView, setSelectedView] = useState<RacesViewMode>('calendar')

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div className={styles.titleBlock}>
          <Title level={1} className={styles.pageTitle}>Races</Title>
        </div>

        <RacesViewSwitcher selectedView={selectedView} onViewChange={setSelectedView} />
      </div>

      {selectedView === 'calendar' ? <RacesCalendarView /> : <RacesTableView />}
    </div>
  )
}

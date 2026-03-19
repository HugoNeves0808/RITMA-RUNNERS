import { Card, Typography } from 'antd'
import styles from './RacesViewPlaceholder.module.css'

const { Paragraph, Title } = Typography

export function RacesCalendarView() {
  return (
    <Card className={styles.viewCard} variant="borderless">
      <div className={styles.viewContent}>
        <p className={styles.eyebrow}>Calendar view</p>
        <Title level={3} className={styles.title}>Race calendar placeholder</Title>
        <Paragraph className={styles.description}>
          This area will host the calendar-based race exploration experience.
        </Paragraph>
      </div>
    </Card>
  )
}

import { Card, Typography } from 'antd'
import styles from './RacesViewPlaceholder.module.css'

const { Paragraph, Title } = Typography

export function RacesCalendarYearlyView() {
  return (
    <Card className={styles.viewCard} variant="borderless">
      <div className={styles.viewContent}>
        <p className={styles.eyebrow}>Yearly view</p>
        <Title level={3} className={styles.title}>Yearly calendar placeholder</Title>
        <Paragraph className={styles.description}>
          The yearly calendar mode is prepared in the component structure and can be implemented next.
        </Paragraph>
      </div>
    </Card>
  )
}

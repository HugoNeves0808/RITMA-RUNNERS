import { Card, Typography } from 'antd'
import styles from './RacesViewPlaceholder.module.css'

const { Paragraph, Title } = Typography

export function RacesTableView() {
  return (
    <Card className={styles.viewCard} variant="borderless">
      <div className={styles.viewContent}>
        <p className={styles.eyebrow}>Table view</p>
        <Title level={3} className={styles.title}>Race table placeholder</Title>
        <Paragraph className={styles.description}>
          This area will host the tabular race listing and related controls.
        </Paragraph>
      </div>
    </Card>
  )
}

import { faBolt, faChartLine, faCompassDrafting, faFlagCheckered, faLink, faRobot } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Button, Tabs, Typography } from 'antd'
import { Link } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'
import styles from './FutureGoalsPage.module.css'

const { Paragraph, Title } = Typography

export function FutureGoalsPage() {
  const items = [
    {
      key: 'what-is-ritma',
      label: 'What is RITMA?',
      children: (
        <div className={styles.tabContent}>
          <Paragraph className={styles.paragraph}>
            RITMA RUNNERS is a web application built to help runners organize races in a clear and
            structured way.
          </Paragraph>
          <Paragraph className={styles.paragraph}>
            It is still intentionally minimalist, but the direction is clear: a practical digital
            companion for runners who want better structure, continuity, and clarity around their
            racing journey.
          </Paragraph>
          <div className={styles.futureGrid}>
            <div className={styles.futureCard}>
              <FontAwesomeIcon icon={faFlagCheckered} className={styles.futureIcon} />
              <div>
                <strong>Race-focused organization</strong>
                <p>Keep track of races with a clearer workflow.</p>
              </div>
            </div>
            <div className={styles.futureCard}>
              <FontAwesomeIcon icon={faChartLine} className={styles.futureIcon} />
              <div>
                <strong>Clear performance history</strong>
                <p>Build a consistent record of results and progress.</p>
              </div>
            </div>
            <div className={styles.futureCard}>
              <FontAwesomeIcon icon={faCompassDrafting} className={styles.futureIcon} />
              <div>
                <strong>Structured runner journey</strong>
                <p>Create a stronger long-term view of your journey.</p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'future-plans',
      label: 'Future Plans',
      children: (
        <div className={styles.tabContent}>
          <Paragraph className={styles.paragraph}>
            RITMA will expand step by step into a more complete platform for planning, analysis,
            and long-term runner support.
          </Paragraph>
          <div className={styles.futureGrid}>
            <div className={styles.futureCard}>
              <FontAwesomeIcon icon={faBolt} className={styles.futureIcon} />
              <div>
                <strong>Training planning</strong>
                <p>Plan training with more structure around your race calendar.</p>
              </div>
            </div>
            <div className={styles.futureCard}>
              <FontAwesomeIcon icon={faLink} className={styles.futureIcon} />
              <div>
                <strong>Platform sync</strong>
                <p>Connect RITMA with Strava, Garmin, and other running tools.</p>
              </div>
            </div>
            <div className={styles.futureCard}>
              <FontAwesomeIcon icon={faRobot} className={styles.futureIcon} />
              <div>
                <strong>Smarter support</strong>
                <p>Use AI-assisted guidance and stronger decision support over time.</p>
              </div>
            </div>
            <div className={styles.futureCard}>
              <FontAwesomeIcon icon={faChartLine} className={styles.futureIcon} />
              <div>
                <strong>Advanced statistics</strong>
                <p>Expand race and training analysis with deeper performance insights.</p>
              </div>
            </div>
            <div className={styles.futureCard}>
              <FontAwesomeIcon icon={faFlagCheckered} className={styles.futureIcon} />
              <div>
                <strong>Progression analysis</strong>
                <p>Understand consistency, progression, and preparation over longer cycles.</p>
              </div>
            </div>
            <div className={styles.futureCard}>
              <FontAwesomeIcon icon={faCompassDrafting} className={styles.futureIcon} />
              <div>
                <strong>Preparation tools</strong>
                <p>Support better planning and decision-making before key races.</p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
  ]

  return (
    <div className={styles.page}>
      <div className={styles.fixedAction}>
        <Button type="primary">
          <Link to={ROUTES.login}>Back to login</Link>
        </Button>
      </div>
      <div className={styles.content}>
        <div className={styles.hero}>
          <span className={styles.eyebrow}>Public overview</span>
          <Title level={1} className={styles.title}>
            RITMA vision and roadmap
          </Title>
          <Paragraph className={styles.lead}>
            A public overview of what RITMA already stands for and where the platform is heading
            next.
          </Paragraph>
        </div>

        <Tabs items={items} className={styles.tabs} />
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Alert, Card, Col, Empty, Row, Spin, Typography } from 'antd'
import { useAuth } from '../../features/auth'
import { fetchProfileSummary } from '../../features/profile/services/profileService'
import type { ProfileSummary } from '../../features/profile/types/profile'
import styles from './ProfilePage.module.css'

const { Title } = Typography

type SummaryMetricProps = {
  label: string
  value: string | number
}

function SummaryMetric({ label, value }: SummaryMetricProps) {
  return (
    <div className={styles.metricCard}>
      <span className={styles.metricLabel}>{label}</span>
      <span className={styles.metricValue}>{value}</span>
    </div>
  )
}

export function ProfilePage() {
  const { token } = useAuth()
  const [summary, setSummary] = useState<ProfileSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setSummary(null)
      setIsLoading(false)
      return
    }

    const loadSummary = async () => {
      try {
        setIsLoading(true)
        setError(null)
        setSummary(await fetchProfileSummary(token))
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Could not load profile summary right now.')
      } finally {
        setIsLoading(false)
      }
    }

    void loadSummary()
  }, [token])

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Title level={1} className={styles.title}>Profile</Title>
      </div>

      {error ? (
        <Alert
          type="error"
          showIcon
          message="Could not load profile"
          description={error}
        />
      ) : null}

      {isLoading ? (
        <div className={styles.loadingState}>
          <Spin size="large" />
        </div>
      ) : null}

      {!isLoading && !error && summary ? (
        <Row gutter={[20, 20]}>
          <Col xs={24}>
            <Card className={styles.card} bordered={false}>
              <div className={styles.metricsGrid}>
                <SummaryMetric label="Total races" value={summary.totalRaces} />
                <SummaryMetric label="Completed races" value={summary.completedRaces} />
                <SummaryMetric label="Favorite race type" value={summary.favoriteRaceType ?? '-'} />
                <SummaryMetric label="Podiums" value={summary.podiums} />
              </div>
            </Card>
          </Col>

          <Col xs={24}>
            <Card className={styles.card} bordered={false}>
              {summary.topRaceTypes.length === 0 ? (
                <div className={styles.emptyState}>
                  <Empty description="No race type data yet." />
                </div>
              ) : (
                <div className={styles.raceTypeList}>
                  {summary.topRaceTypes.map((item) => (
                    <div key={item.raceTypeName} className={styles.raceTypeRow}>
                      <div className={styles.raceTypeMain}>
                        <span className={styles.raceTypeName}>{item.raceTypeName}</span>
                        <span className={styles.raceTypeMeta}>{item.raceCount} races</span>
                      </div>
                      <div className={styles.raceTypeBadge}>
                        <span className={styles.raceTypeBadgeValue}>{item.bestEffortsTracked}</span>
                        <span className={styles.raceTypeBadgeLabel}>Best efforts tracked</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </Col>
        </Row>
      ) : null}
    </div>
  )
}

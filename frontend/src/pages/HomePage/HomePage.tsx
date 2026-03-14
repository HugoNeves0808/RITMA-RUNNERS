import { useEffect, useState } from 'react'
import { faCalendarDays, faDatabase, faFlagCheckered } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Alert, Button, Card, Col, Row, Space, Spin, Tag, Typography } from 'antd'
import { Link } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'
import { useAuth } from '../../features/auth'
import { fetchBackendHealth } from '../../features/system'
import type { BackendHealth } from '../../types/system'
import styles from './HomePage.module.css'

const { Paragraph, Title } = Typography

export function HomePage() {
  const { isAuthenticated, isAdmin, user } = useAuth()
  const [backendHealth, setBackendHealth] = useState<BackendHealth | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadBackendHealth = async () => {
      try {
        const healthData = await fetchBackendHealth()
        setBackendHealth(healthData)
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : 'Unknown error')
      } finally {
        setIsLoading(false)
      }
    }

    void loadBackendHealth()
  }, [])

  return (
    <>
      <section className={styles.hero}>
        <Tag bordered={false} color="gold">
          Authentication foundation
        </Tag>
        <Title>RITMA RUNNERS</Title>
        <Paragraph className={styles.heroCopy}>
          Application prepared to register, organize, and plan running races with secure
          authentication, protected routes, and admin-only diagnostics.
        </Paragraph>
        <Space size="middle" wrap>
          <Button type="primary" size="large">
            Frontend React + TypeScript
          </Button>
          <Button size="large">Backend Spring Boot</Button>
          {isAuthenticated ? <Tag color="green">{user?.email}</Tag> : null}
        </Space>
      </section>

      <Card className={styles.statusCard} variant="borderless">
        <Title level={4}>Frontend, backend, and database connectivity test</Title>
        {isLoading ? (
          <Space>
            <Spin size="small" />
            <span>Checking backend and database at http://localhost:8081</span>
          </Space>
        ) : null}
        {backendHealth ? (
          <Alert
            type={backendHealth.status === 'ok' ? 'success' : 'warning'}
            showIcon
            message={backendHealth.status === 'ok'
              ? 'Backend and PostgreSQL reachable'
              : 'Health check reported a degraded status'}
            description={`Received public health status: ${backendHealth.status}.`}
          />
        ) : null}
        {error ? (
          <Alert
            type="error"
            showIcon
            message="Backend or database unavailable"
            description={`Could not get a valid response from http://localhost:8081 (${error})`}
          />
        ) : null}
      </Card>

      <Card className={styles.statusCard} variant="borderless">
        <Space align="start" className={styles.sectionTitle}>
          <FontAwesomeIcon icon={faDatabase} className={styles.cardIcon} />
          <div>
            <Title level={4}>Database status</Title>
            <Paragraph>
              The frontend only checks whether the backend can connect to PostgreSQL.
            </Paragraph>
          </div>
        </Space>
        {backendHealth ? (
          <Alert
            type={backendHealth.status === 'ok' ? 'success' : 'warning'}
            showIcon
            message={backendHealth.status === 'ok' ? 'Database connectivity verified' : 'Database connectivity needs attention'}
            description={backendHealth.status === 'ok'
              ? 'The backend public health check completed successfully.'
              : 'Check the admin diagnostics endpoint for technical details.'}
          />
        ) : (
          <Alert
            type="info"
            showIcon
            message="Waiting for backend status"
            description="The database status will appear after the backend health check finishes."
          />
        )}
      </Card>

      <Row gutter={[24, 24]}>
        <Col xs={24} md={12}>
          <Card className={styles.infoCard} variant="borderless">
            <Space align="start">
              <FontAwesomeIcon icon={faFlagCheckered} className={styles.cardIcon} />
              <div>
                <Title level={4}>Authentication ready</Title>
                <Paragraph>
                  JWT login, persisted session state, and protected routes are now prepared on top
                  of the existing project foundation.
                </Paragraph>
              </div>
            </Space>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card className={styles.infoCard} variant="borderless">
            <Space align="start">
              <FontAwesomeIcon icon={faCalendarDays} className={styles.cardIcon} />
              <div>
                <Title level={4}>Admin diagnostics</Title>
                <Paragraph>
                  The technical diagnostics area is protected. Only authenticated admins can see
                  the entry point and access the route.
                </Paragraph>
                {isAdmin ? (
                  <Space>
                    <Button type="link">
                      <Link to={ROUTES.adminDiagnostics}>Open diagnostics</Link>
                    </Button>
                    <Button type="link">
                      <Link to={ROUTES.adminPendingAccounts}>Review pending accounts</Link>
                    </Button>
                  </Space>
                ) : null}
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
    </>
  )
}

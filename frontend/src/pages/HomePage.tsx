import { useEffect, useState } from 'react'
import { faCalendarDays, faDatabase, faFlagCheckered } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Alert, Button, Card, Col, Row, Space, Spin, Tag, Typography } from 'antd'
import { Link } from 'react-router-dom'
import { buildApiUrl } from '../api'
import { useAuth } from '../auth/AuthProvider'

const { Paragraph, Title } = Typography

type BackendHealth = {
  status: string
  application: string
  databaseConfigured: boolean
  databaseStatus: string
  databaseName?: string
}

export function HomePage() {
  const { isAuthenticated, isAdmin, user } = useAuth()
  const [backendHealth, setBackendHealth] = useState<BackendHealth | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadBackendHealth = async () => {
      try {
        const response = await fetch(buildApiUrl('/api/health'))

        if (!response.ok) {
          throw new Error(`Health HTTP ${response.status}`)
        }

        const healthData = (await response.json()) as BackendHealth
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
      <section className="hero">
        <Tag bordered={false} color="gold">
          Authentication foundation
        </Tag>
        <Title>RITMA RUNNERS</Title>
        <Paragraph className="hero-copy">
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

      <Card className="status-card" variant="borderless">
        <Title level={4}>Frontend, backend, and database connectivity test</Title>
        {isLoading ? (
          <Space>
            <Spin size="small" />
            <span>Checking backend and database at http://localhost:8081</span>
          </Space>
        ) : null}
        {backendHealth ? (
          <Alert
            type={backendHealth.databaseStatus === 'connected' ? 'success' : 'warning'}
            showIcon
            message={backendHealth.databaseStatus === 'connected'
              ? 'Backend and PostgreSQL reachable'
              : 'Backend reachable but database not connected'}
            description={`Received response: ${backendHealth.application} (${backendHealth.status}) | DB: ${backendHealth.databaseName ?? 'unknown'} (${backendHealth.databaseStatus})`}
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

      <Card className="status-card" variant="borderless">
        <Space align="start" className="section-title">
          <FontAwesomeIcon icon={faDatabase} className="card-icon" />
          <div>
            <Title level={4}>Database status</Title>
            <Paragraph>
              The frontend only checks whether the backend can connect to PostgreSQL.
            </Paragraph>
          </div>
        </Space>
        {backendHealth ? (
          <Alert
            type={backendHealth.databaseStatus === 'connected' ? 'success' : 'warning'}
            showIcon
            message={backendHealth.databaseStatus === 'connected' ? 'Database connected' : 'Database unavailable'}
            description={backendHealth.databaseStatus === 'connected'
              ? `Connected to database "${backendHealth.databaseName ?? 'unknown'}".`
              : 'The backend is running, but the database connection is not available.'}
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
          <Card className="info-card" variant="borderless">
            <Space align="start">
              <FontAwesomeIcon icon={faFlagCheckered} className="card-icon" />
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
          <Card className="info-card" variant="borderless">
            <Space align="start">
              <FontAwesomeIcon icon={faCalendarDays} className="card-icon" />
              <div>
                <Title level={4}>Admin diagnostics</Title>
                <Paragraph>
                  The technical diagnostics area is protected. Only authenticated admins can see
                  the entry point and access the route.
                </Paragraph>
                {isAdmin ? (
                  <Button type="link">
                    <Link to="/admin/diagnostics">Open diagnostics</Link>
                  </Button>
                ) : null}
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
    </>
  )
}

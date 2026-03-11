import { useEffect, useState } from 'react'
import { faCalendarDays, faFlagCheckered } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Alert, Button, Card, Col, Layout, Row, Space, Spin, Tag, Typography } from 'antd'
import './App.css'

const { Content } = Layout
const { Paragraph, Title } = Typography

type BackendHealth = {
  status: string
  application: string
}

function App() {
  const [backendHealth, setBackendHealth] = useState<BackendHealth | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch('http://localhost:8081/api/health')

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const data = (await response.json()) as BackendHealth
        setBackendHealth(data)
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : 'Unknown error')
      } finally {
        setIsLoading(false)
      }
    }

    void checkBackend()
  }, [])

  return (
    <Layout className="app-shell">
      <Content className="app-content">
        <section className="hero">
          <Tag bordered={false} color="gold">
            Initial setup
          </Tag>
          <Title>RITMA RUNNERS</Title>
          <Paragraph className="hero-copy">
            Application prepared to register, organize, and plan running races
            with frontend and backend evolving independently.
          </Paragraph>
          <Space size="middle" wrap>
            <Button type="primary" size="large">
              Frontend React + TypeScript
            </Button>
            <Button size="large">Backend Spring Boot</Button>
          </Space>
        </section>

        <Card className="status-card" variant="borderless">
          <Title level={4}>Frontend to backend connectivity test</Title>
          {isLoading ? (
            <Space>
              <Spin size="small" />
              <span>Checking backend at http://localhost:8081/api/health</span>
            </Space>
          ) : null}
          {backendHealth ? (
            <Alert
              type="success"
              showIcon
              message="Backend reachable"
              description={`Received response: ${backendHealth.application} (${backendHealth.status})`}
            />
          ) : null}
          {error ? (
            <Alert
              type="error"
              showIcon
              message="Backend unavailable"
              description={`Could not get a response from http://localhost:8081/api/health (${error})`}
            />
          ) : null}
        </Card>

        <Row gutter={[24, 24]}>
          <Col xs={24} md={12}>
            <Card className="info-card" variant="borderless">
              <Space align="start">
                <FontAwesomeIcon icon={faFlagCheckered} className="card-icon" />
                <div>
                  <Title level={4}>Independent frontend</Title>
                  <Paragraph>
                    Vite project with React, TypeScript, Ant Design, and Font
                    Awesome, ready to grow without tight backend coupling.
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
                  <Title level={4}>Independent backend</Title>
                  <Paragraph>
                    Spring Boot project prepared as the API foundation, with
                    PostgreSQL planned in the stack and no domain or endpoints
                    defined yet.
                  </Paragraph>
                </div>
              </Space>
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  )
}

export default App

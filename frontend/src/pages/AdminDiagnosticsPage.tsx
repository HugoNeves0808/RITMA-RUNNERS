import { useEffect, useState } from 'react'
import { Alert, Card, Descriptions, Spin, Typography } from 'antd'
import { useAuth } from '../hooks/useAuth'
import { fetchAdminDiagnostics } from '../features/admin/services/diagnosticsService'
import type { DiagnosticsPayload } from '../types/system'

const { Paragraph, Title } = Typography

export function AdminDiagnosticsPage() {
  const { token } = useAuth()
  const [data, setData] = useState<DiagnosticsPayload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadDiagnostics = async () => {
      try {
        const payload = await fetchAdminDiagnostics(token ?? '')
        setData(payload)
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : 'Unknown error')
      } finally {
        setIsLoading(false)
      }
    }

    void loadDiagnostics()
  }, [token])

  return (
    <Card className="status-card" variant="borderless">
      <Title level={2}>System Health / Diagnostics</Title>
      <Paragraph>
        This is a technical admin-only page. It is protected in both the frontend and the backend.
      </Paragraph>
      {isLoading ? <Spin size="large" /> : null}
      {error ? (
        <Alert type="error" showIcon message="Could not load diagnostics" description={error} />
      ) : null}
      {data ? (
        <Descriptions bordered column={1}>
          <Descriptions.Item label="Status">{data.status}</Descriptions.Item>
          <Descriptions.Item label="Application">{data.application}</Descriptions.Item>
          <Descriptions.Item label="Database">{data.database}</Descriptions.Item>
          <Descriptions.Item label="Server time">{data.serverTime}</Descriptions.Item>
          <Descriptions.Item label="Current user">{`${data.currentUser.email} (${data.currentUser.role})`}</Descriptions.Item>
        </Descriptions>
      ) : null}
    </Card>
  )
}

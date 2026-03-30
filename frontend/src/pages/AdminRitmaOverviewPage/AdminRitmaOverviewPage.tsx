import { useEffect, useMemo, useState } from 'react'
import { faRotateLeft } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Alert, Button, Card, Empty, Space, Spin, Table, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'
import { useAuth } from '../../features/auth'
import {
  approvePendingApproval,
  fetchAdminOverview,
  fetchPendingApprovals,
  rejectPendingApproval,
  type AdminOverviewPayload,
  type PendingApproval,
} from '../../features/admin'
import styles from './AdminRitmaOverviewPage.module.css'

const { Title } = Typography

function formatRequestDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '-'
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function formatRequestTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '-'
  }

  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function AdminRitmaOverviewPage() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [overview, setOverview] = useState<AdminOverviewPayload | null>(null)
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([])
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [overviewError, setOverviewError] = useState<string | null>(null)
  const [pendingError, setPendingError] = useState<string | null>(null)

  const loadDashboard = async (refresh = false) => {
    if (!token) {
      return
    }

    if (refresh) {
      setIsRefreshing(true)
    } else {
      setIsLoading(true)
    }

    const [overviewResult, pendingResult] = await Promise.allSettled([
      fetchAdminOverview(token),
      fetchPendingApprovals(token),
    ])

    if (overviewResult.status === 'fulfilled') {
      setOverview(overviewResult.value)
      setOverviewError(null)
    } else {
      setOverviewError(
        overviewResult.reason instanceof Error
          ? overviewResult.reason.message
          : 'Unable to load overview right now.',
      )
    }

    if (pendingResult.status === 'fulfilled') {
      setPendingApprovals(pendingResult.value)
      setPendingError(null)
    } else {
      setPendingError(
        pendingResult.reason instanceof Error
          ? pendingResult.reason.message
          : 'Unable to load pending approvals right now.',
      )
    }

    setIsLoading(false)
    setIsRefreshing(false)
  }

  useEffect(() => {
    void loadDashboard()
  }, [token])

  const previewApprovals = useMemo(() => pendingApprovals.slice(0, 5), [pendingApprovals])

  const metricCards = [
    {
      key: 'pending',
      label: 'Pending approvals',
      value: pendingApprovals.length,
      hint: 'Accounts waiting for review',
      highlighted: true,
    },
    {
      key: 'users',
      label: 'Total users',
      value: overview?.totalUsers ?? 0,
      hint: 'Active accounts',
    },
    {
      key: 'admins',
      label: 'Total admins',
      value: overview?.totalAdmins ?? 0,
      hint: 'Admin accounts',
    },
    {
      key: 'active-today',
      label: 'Active users today',
      value: overview?.activeUsersToday ?? 0,
      hint: 'Unique website users today',
    },
    {
      key: 'registrations',
      label: 'New registrations',
      value: overview?.newRegistrationsLast7Days ?? 0,
      hint: 'Created in the last 7 days',
    },
  ]

  const handleApprove = async (userId: string) => {
    if (!token) {
      return
    }

    try {
      setProcessingId(userId)
      setPendingError(null)
      await approvePendingApproval(userId, token)
      await loadDashboard(true)
    } catch (actionError) {
      setPendingError(actionError instanceof Error ? actionError.message : 'Unable to approve account.')
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (userId: string) => {
    if (!token) {
      return
    }

    try {
      setProcessingId(userId)
      setPendingError(null)
      await rejectPendingApproval(userId, token)
      await loadDashboard(true)
    } catch (actionError) {
      setPendingError(actionError instanceof Error ? actionError.message : 'Unable to reject account.')
    } finally {
      setProcessingId(null)
    }
  }

  const pendingColumns: ColumnsType<PendingApproval> = [
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Request date',
      dataIndex: 'requestedAt',
      key: 'requestDate',
      render: (value: string) => formatRequestDate(value),
    },
    {
      title: 'Request time',
      dataIndex: 'requestedAt',
      key: 'requestTime',
      render: (value: string) => formatRequestTime(value),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, approval) => (
        <Space>
          <Button
            type="primary"
            className={styles.approveButton}
            loading={processingId === approval.id}
            onClick={() => void handleApprove(approval.id)}
          >
            Approve
          </Button>
          <Button
            danger
            loading={processingId === approval.id}
            onClick={() => void handleReject(approval.id)}
          >
            Reject
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <Title level={1} className={styles.pageTitle}>Overview</Title>

        <Space wrap>
          <Button
            onClick={() => void loadDashboard(true)}
            loading={isRefreshing}
            icon={<FontAwesomeIcon icon={faRotateLeft} />}
            aria-label="Refresh overview"
            title="Refresh"
          />
        </Space>
      </div>

      {isLoading ? (
        <Card className={styles.loadingCard} variant="borderless">
          <Space>
            <Spin size="small" />
            <span>Loading overview</span>
          </Space>
        </Card>
      ) : null}

      <div className={styles.metricsGrid}>
        {metricCards.map((card) => (
          <Card
            key={card.key}
            className={`${styles.metricCard} ${card.highlighted ? styles.metricCardHighlight : ''}`.trim()}
            variant="borderless"
          >
            <span className={styles.metricLabel}>{card.label}</span>
            <span className={styles.metricValue}>{card.value}</span>
            <span className={styles.metricHint}>{card.hint}</span>
          </Card>
        ))}
      </div>

      {overviewError ? (
        <Alert type="error" showIcon message="Could not load overview metrics" description={overviewError} />
      ) : null}

      <div className={styles.mainGrid}>
        <Card className={styles.pendingCard} variant="borderless">
          <div className={styles.sectionHeader}>
            <Title level={4} className={styles.sectionTitle}>Pending approvals</Title>
            <Button
              type="primary"
              className={styles.primaryActionButton}
              onClick={() => navigate(ROUTES.adminPendingApprovals)}
            >
              View all pending approvals
            </Button>
          </div>

          {pendingError ? (
            <Alert type="error" showIcon message="Could not load pending approvals" description={pendingError} />
          ) : null}

          {!pendingError && previewApprovals.length > 0 ? (
            <Table
              rowKey="id"
              columns={pendingColumns}
              dataSource={previewApprovals}
              pagination={false}
            />
          ) : null}

          {!pendingError && previewApprovals.length === 0 ? (
            <div className={styles.emptyState}>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="There are no pending approvals right now."
              />
            </div>
          ) : null}
        </Card>
      </div>

    </div>
  )
}

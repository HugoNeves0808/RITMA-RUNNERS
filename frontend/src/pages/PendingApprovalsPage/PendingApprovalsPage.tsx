import { faBroom, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useDeferredValue, useEffect, useState } from 'react'
import { Alert, Button, Card, Checkbox, Empty, Input, Popconfirm, Space, Spin, Table, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useAuth } from '../../features/auth'
import {
  approvePendingApproval,
  fetchPendingApprovals,
  rejectPendingApproval,
  type PendingApproval,
} from '../../features/admin'
import styles from './PendingApprovalsPage.module.css'

const { Title } = Typography

function formatRequestedAt(value: string) {
  const requestedAt = new Date(value)
  const now = new Date()
  const diffMs = now.getTime() - requestedAt.getTime()

  if (Number.isNaN(requestedAt.getTime()) || diffMs < 0) {
    return '-'
  }

  const minuteMs = 60 * 1000
  const hourMs = 60 * minuteMs
  const dayMs = 24 * hourMs
  const monthMs = 30 * dayMs
  const yearMs = 365 * dayMs

  if (diffMs < dayMs) {
    const hours = Math.floor(diffMs / hourMs)
    const minutes = Math.floor((diffMs % hourMs) / minuteMs)

    if (hours <= 0) {
      return `${Math.max(minutes, 1)} min ago`
    }

    return `${hours}h ${minutes}min ago`
  }

  if (diffMs < monthMs) {
    const days = Math.floor(diffMs / dayMs)
    return `${days} day${days === 1 ? '' : 's'} ago`
  }

  if (diffMs < yearMs) {
    const months = Math.floor(diffMs / monthMs)
    return `${months} month${months === 1 ? '' : 's'} ago`
  }

  const years = Math.floor(diffMs / yearMs)
  return `${years} year${years === 1 ? '' : 's'} ago`
}

function isRequestStale(value: string) {
  const requestedAt = new Date(value)
  const now = new Date()
  const diffMs = now.getTime() - requestedAt.getTime()
  const threeDaysMs = 3 * 24 * 60 * 60 * 1000

  if (Number.isNaN(requestedAt.getTime()) || diffMs < 0) {
    return false
  }

  return diffMs >= threeDaysMs
}

export function PendingApprovalsPage() {
  const { token } = useAuth()
  const [approvals, setApprovals] = useState<PendingApproval[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [olderThanThreeDays, setOlderThanThreeDays] = useState(false)
  const deferredSearch = useDeferredValue(search)
  const normalizedSearch = search.trim().toLowerCase()
  const filteredApprovals = approvals.filter((approval) => {
    const matchesEmail = !normalizedSearch || approval.email.toLowerCase().includes(normalizedSearch)
    const requestedAt = new Date(approval.requestedAt)
    const threeDaysMs = 3 * 24 * 60 * 60 * 1000
    const matchesAge =
      !olderThanThreeDays ||
      (!Number.isNaN(requestedAt.getTime()) && Date.now() - requestedAt.getTime() >= threeDaysMs)

    return matchesEmail && matchesAge
  })

  useEffect(() => {
    const loadPendingApprovals = async () => {
      if (!token) {
        setApprovals([])
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        const data = await fetchPendingApprovals(token, deferredSearch, olderThanThreeDays)
        setApprovals(data)
        setError(null)
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unknown error')
      } finally {
        setIsLoading(false)
      }
    }

    void loadPendingApprovals()
  }, [token, deferredSearch, olderThanThreeDays])

  const handleApprove = async (userId: string) => {
    if (!token) {
      return
    }

    setProcessingId(userId)
    setError(null)

    try {
      await approvePendingApproval(userId, token)
      setApprovals((currentApprovals) => currentApprovals.filter((approval) => approval.id !== userId))
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Unknown error')
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (userId: string) => {
    if (!token) {
      return
    }

    setProcessingId(userId)
    setError(null)

    try {
      await rejectPendingApproval(userId, token)
      setApprovals((currentApprovals) => currentApprovals.filter((approval) => approval.id !== userId))
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Unknown error')
    } finally {
      setProcessingId(null)
    }
  }

  const columns: ColumnsType<PendingApproval> = [
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Requested at',
      dataIndex: 'requestedAt',
      key: 'requestedAt',
      render: (value: string) => (
        <span className={styles.requestedAtCell}>
          {formatRequestedAt(value)}
          {isRequestStale(value) ? (
            <FontAwesomeIcon
              icon={faTriangleExclamation}
              className={styles.requestWarning}
              title="Request is older than 3 days"
            />
          ) : null}
        </span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, approval) => (
        <div className={styles.actions}>
          <Button
            type="primary"
            className={styles.approveButton}
            loading={processingId === approval.id}
            onClick={() => void handleApprove(approval.id)}
          >
            Approve
          </Button>
          <Popconfirm
            title="Reject request"
            description="This will delete the pending account request."
            okText="Reject"
            cancelText="Cancel"
            onConfirm={() => void handleReject(approval.id)}
          >
            <Button danger loading={processingId === approval.id}>
              Reject
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ]

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <Title level={1} className={styles.pageTitle}>Pending approvals</Title>
        </div>

        <div className={styles.summaryBadge}>
          <span className={styles.summaryLabel}>Pending</span>
          <span className={styles.summaryValue}>{filteredApprovals.length}</span>
        </div>
      </div>

      {isLoading ? (
        <Space>
          <Spin size="small" />
          <span>Loading pending approvals</span>
        </Space>
      ) : null}

      {error ? (
        <Alert type="error" showIcon message="Could not process pending approvals" description={error} />
      ) : null}

      <div className={styles.contentLayout}>
        <div className={styles.tableSection}>
          <Card className={styles.pageCard} variant="borderless">
            {!isLoading && filteredApprovals.length === 0 ? (
              <div className={styles.emptyWrap}>
                <Empty description={approvals.length === 0 ? 'No pending approvals.' : 'No pending approvals match the current filters.'} />
              </div>
            ) : null}

            {!isLoading && filteredApprovals.length > 0 ? (
              <Table
                rowKey="id"
                columns={columns}
                dataSource={filteredApprovals}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: false,
                  hideOnSinglePage: true,
                }}
              />
            ) : null}
          </Card>
        </div>

        <aside className={styles.sidebar}>
          <div className={styles.sidebarCard}>
            <div className={styles.sidebarHeader}>
              <h3 className={styles.sidebarTitle}>Filters</h3>
              <Button
                type="text"
                className={styles.clearButton}
                icon={<FontAwesomeIcon icon={faBroom} />}
                title="Clear filters"
                aria-label="Clear filters"
                onClick={() => {
                  setSearch('')
                  setOlderThanThreeDays(false)
                }}
              />
            </div>

            <div className={styles.sidebarDivider} />

            <label className={styles.filterField}>
              <span className={styles.filterLabel}>Email</span>
              <Input
                allowClear
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by email"
                className={styles.searchInput}
              />
            </label>

            <label className={styles.checkboxField}>
              <Checkbox
                checked={olderThanThreeDays}
                onChange={(event) => setOlderThanThreeDays(event.target.checked)}
              >
                Waiting for over 3 days
              </Checkbox>
            </label>
          </div>
        </aside>
      </div>
    </div>
  )
}

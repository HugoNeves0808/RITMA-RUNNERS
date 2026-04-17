import { useEffect, useMemo, useState } from 'react'
import { faRotateLeft } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Alert, Button, Card, Empty, Space, Spin, Table, Typography, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
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
import { useLanguage } from '../../contexts/LanguageContext'
import styles from './AdminRitmaOverviewPage.module.css'

const { Title } = Typography

function formatRequestDate(value: string, locale: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '-'
  }

  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export function AdminRitmaOverviewPage() {
  const { t } = useTranslation()
  const { language } = useLanguage()
  const { token } = useAuth()
  const navigate = useNavigate()
  const [messageApi, contextHolder] = message.useMessage()
  const [overview, setOverview] = useState<AdminOverviewPayload | null>(null)
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([])
  const [processingAction, setProcessingAction] = useState<{ userId: string, type: 'approve' | 'reject' } | null>(null)
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
          : t('adminOverview.errors.loadOverviewFallback'),
      )
    }

    if (pendingResult.status === 'fulfilled') {
      setPendingApprovals(pendingResult.value)
      setPendingError(null)
    } else {
      setPendingError(
        pendingResult.reason instanceof Error
          ? pendingResult.reason.message
          : t('adminOverview.errors.loadPendingFallback'),
      )
    }

    setIsLoading(false)
    setIsRefreshing(false)
  }

  useEffect(() => {
    void loadDashboard()
  }, [token])

  const previewApprovals = useMemo(() => pendingApprovals.slice(0, 5), [pendingApprovals])

  const metricCards = useMemo(() => ([
    {
      key: 'pending',
      label: t('adminOverview.metrics.pending.label'),
      value: pendingApprovals.length,
      hint: t('adminOverview.metrics.pending.hint'),
      highlighted: true,
    },
    {
      key: 'users',
      label: t('adminOverview.metrics.users.label'),
      value: overview?.totalUsers ?? 0,
      hint: t('adminOverview.metrics.users.hint'),
    },
    {
      key: 'admins',
      label: t('adminOverview.metrics.admins.label'),
      value: overview?.totalAdmins ?? 0,
      hint: t('adminOverview.metrics.admins.hint'),
    },
    {
      key: 'active-today',
      label: t('adminOverview.metrics.activeToday.label'),
      value: overview?.activeUsersToday ?? 0,
      hint: t('adminOverview.metrics.activeToday.hint'),
    },
    {
      key: 'registrations',
      label: t('adminOverview.metrics.registrations.label'),
      value: overview?.newRegistrationsLast7Days ?? 0,
      hint: t('adminOverview.metrics.registrations.hint'),
    },
  ]), [overview, pendingApprovals.length, t])

  const handleApprove = async (userId: string) => {
    if (!token) {
      return
    }

    const notificationKey = `overview-approve-pending-${userId}`
    try {
      setProcessingAction({ userId, type: 'approve' })
      setPendingError(null)
      messageApi.open({
        key: notificationKey,
        type: 'loading',
        content: t('adminOverview.approveLoading'),
        duration: 0,
      })
      await approvePendingApproval(userId, token)
      await loadDashboard(true)
      messageApi.success({
        key: notificationKey,
        content: t('adminOverview.approveSuccess'),
        duration: 2,
      })
    } catch (actionError) {
      messageApi.destroy(notificationKey)
      setPendingError(actionError instanceof Error ? actionError.message : t('adminOverview.errors.approveFallback'))
    } finally {
      setProcessingAction(null)
    }
  }

  const handleReject = async (userId: string) => {
    if (!token) {
      return
    }

    try {
      setProcessingAction({ userId, type: 'reject' })
      setPendingError(null)
      await rejectPendingApproval(userId, token)
      await loadDashboard(true)
    } catch (actionError) {
      setPendingError(actionError instanceof Error ? actionError.message : t('adminOverview.errors.rejectFallback'))
    } finally {
      setProcessingAction(null)
    }
  }

  const dateTimeLocale = language === 'pt' ? 'pt-PT' : 'en-GB'

  const pendingColumns: ColumnsType<PendingApproval> = [
    {
      title: t('adminOverview.table.email'),
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: t('adminOverview.table.requestDate'),
      dataIndex: 'requestedAt',
      key: 'requestDate',
      render: (value: string) => formatRequestDate(value, dateTimeLocale),
    },
    {
      title: t('adminOverview.table.actions'),
      key: 'actions',
      render: (_, approval) => (
        <Space>
          <Button
            type="primary"
            className={styles.approveButton}
            disabled={processingAction?.userId === approval.id}
            onClick={() => void handleApprove(approval.id)}
          >
            {t('adminOverview.approve')}
          </Button>
          <Button
            danger
            loading={processingAction?.userId === approval.id && processingAction.type === 'reject'}
            disabled={processingAction?.userId === approval.id && processingAction.type === 'approve'}
            onClick={() => void handleReject(approval.id)}
          >
            {t('adminOverview.reject')}
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <>
      {contextHolder}
      <div className={styles.page}>
        <div className={styles.pageHeader}>
          <Title level={1} className={styles.pageTitle}>{t('adminOverview.title')}</Title>

          <Space wrap>
            <Button
              onClick={() => void loadDashboard(true)}
              loading={isRefreshing}
              icon={<FontAwesomeIcon icon={faRotateLeft} />}
              aria-label={t('adminOverview.refreshAria')}
              title={t('adminOverview.refreshTitle')}
            />
          </Space>
        </div>

        {isLoading ? (
          <Card className={styles.loadingCard} variant="borderless">
            <div className={styles.loadingState}>
              <Space size="middle">
                <Spin />
                <span className={styles.loadingText}>{t('adminOverview.loading')}</span>
              </Space>
            </div>
          </Card>
        ) : null}

        {!isLoading ? (
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
        ) : null}

        {overviewError ? (
          <Alert type="error" showIcon message={t('adminOverview.metricsErrorTitle')} description={overviewError} />
        ) : null}

        {!isLoading ? (
          <div className={styles.mainGrid}>
            <Card className={styles.pendingCard} variant="borderless">
              <div className={styles.sectionHeader}>
                <Title level={4} className={styles.sectionTitle}>{t('adminOverview.pendingTitle')}</Title>
                <Button
                  type="primary"
                  className={styles.primaryActionButton}
                  onClick={() => navigate(ROUTES.adminPendingApprovals)}
                >
                  {t('adminOverview.viewAllPending')}
                </Button>
              </div>

              {pendingError ? (
                <Alert type="error" showIcon message={t('adminOverview.pendingErrorTitle')} description={pendingError} />
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
                    description={t('adminOverview.emptyPending')}
                  />
                </div>
              ) : null}
            </Card>
          </div>
        ) : null}
      </div>
    </>
  )
}

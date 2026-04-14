import { faAngleDown, faAngleUp, faBroom, faMagnifyingGlass, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { Alert, Button, Card, Checkbox, Empty, Input, Modal, Popconfirm, Space, Spin, Table, Typography, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../features/auth'
import { STORAGE_KEYS } from '../../constants/storage'
import {
  approvePendingApproval,
  fetchPendingApprovals,
  rejectPendingApproval,
  type PendingApproval,
} from '../../features/admin'
import { useLanguage } from '../../contexts/LanguageContext'
import styles from './PendingApprovalsPage.module.css'

const { Title } = Typography

type PersistedPendingApprovalsFiltersState = {
  search: string
  olderThanThreeDays: boolean
  isAgeOpen: boolean
}

function readPersistedPendingApprovalsFilters(): PersistedPendingApprovalsFiltersState | null {
  if (typeof window === 'undefined') {
    return null
  }

  const rawValue = window.sessionStorage.getItem(STORAGE_KEYS.pendingApprovalsFilters)
  if (!rawValue) {
    return null
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<PersistedPendingApprovalsFiltersState>
    return {
      search: typeof parsed.search === 'string' ? parsed.search : '',
      olderThanThreeDays: parsed.olderThanThreeDays ?? false,
      isAgeOpen: parsed.isAgeOpen ?? true,
    }
  } catch {
    return null
  }
}

type CheckboxFilterSectionProps = {
  title: string
  count: number
  isOpen: boolean
  onToggle: () => void
  toggleLabel: string
  children: React.ReactNode
}

function CheckboxFilterSection({
  title,
  count,
  isOpen,
  onToggle,
  toggleLabel,
  children,
}: CheckboxFilterSectionProps) {
  return (
    <div className={styles.filterField}>
      <div className={styles.checkboxSectionHeader}>
        <span className={styles.checkboxSectionTitleRow}>
          <span className={styles.filterLabel}>{title}</span>
          {count > 0 ? <span className={styles.filterCount}>{count}</span> : null}
        </span>
        <button
          type="button"
          className={styles.checkboxSectionToggle}
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-label={toggleLabel}
        >
          <FontAwesomeIcon icon={isOpen ? faAngleUp : faAngleDown} className={styles.checkboxSectionIcon} />
        </button>
      </div>

      {isOpen ? <div className={styles.checkboxSectionBody}>{children}</div> : null}
    </div>
  )
}

function formatRequestedAt(value: string, locale: string, t: (key: string) => string) {
  const requestedAt = new Date(value)
  const now = new Date()
  const diffMs = now.getTime() - requestedAt.getTime()

  if (Number.isNaN(requestedAt.getTime()) || diffMs < 0) {
    return t('pendingApprovals.lastRequested.invalid')
  }

  const minuteMs = 60 * 1000
  const hourMs = 60 * minuteMs
  const dayMs = 24 * hourMs
  const monthMs = 30 * dayMs
  const yearMs = 365 * dayMs

  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'always' })

  if (diffMs < hourMs) {
    const minutes = Math.max(Math.floor(diffMs / minuteMs), 1)
    return formatter.format(-minutes, 'minute')
  }

  if (diffMs < dayMs) {
    const hours = Math.max(Math.floor(diffMs / hourMs), 1)
    return formatter.format(-hours, 'hour')
  }

  if (diffMs < monthMs) {
    const days = Math.floor(diffMs / dayMs)
    return formatter.format(-Math.max(days, 1), 'day')
  }

  if (diffMs < yearMs) {
    const months = Math.floor(diffMs / monthMs)
    return formatter.format(-Math.max(months, 1), 'month')
  }

  const years = Math.floor(diffMs / yearMs)
  return formatter.format(-Math.max(years, 1), 'year')
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
  const { t } = useTranslation()
  const { language } = useLanguage()
  const { token } = useAuth()
  const persistedFilters = useMemo(() => readPersistedPendingApprovalsFilters(), [])
  const isPageRefreshRef = useRef(false)
  const [messageApi, contextHolder] = message.useMessage()
  const [approvals, setApprovals] = useState<PendingApproval[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [processingAction, setProcessingAction] = useState<{ userId: string, type: 'approve' | 'reject' } | null>(null)
  const [search, setSearch] = useState(persistedFilters?.search ?? '')
  const [olderThanThreeDays, setOlderThanThreeDays] = useState(persistedFilters?.olderThanThreeDays ?? false)
  const [isAgeOpen, setIsAgeOpen] = useState(persistedFilters?.isAgeOpen ?? true)
  const [approvedAccountDetails, setApprovedAccountDetails] = useState<{
    email: string
    temporaryPassword: string
  } | null>(null)
  const deferredSearch = useDeferredValue(search)
  const normalizedSearch = search.trim().toLowerCase()
  const shouldShowClearFiltersButton = search.trim().length > 0 || olderThanThreeDays
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
        setError(loadError instanceof Error ? loadError.message : t('pendingApprovals.errors.unknown'))
      } finally {
        setIsLoading(false)
      }
    }

    void loadPendingApprovals()
  }, [token, deferredSearch, olderThanThreeDays, t])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.sessionStorage.setItem(STORAGE_KEYS.pendingApprovalsFilters, JSON.stringify({
      search,
      olderThanThreeDays,
      isAgeOpen,
    } satisfies PersistedPendingApprovalsFiltersState))
  }, [isAgeOpen, olderThanThreeDays, search])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const handleBeforeUnload = () => {
      isPageRefreshRef.current = true
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)

      if (!isPageRefreshRef.current) {
        window.sessionStorage.removeItem(STORAGE_KEYS.pendingApprovalsFilters)
      }
    }
  }, [])

  const handleApprove = async (userId: string) => {
    if (!token) {
      return
    }

    const notificationKey = `approve-pending-${userId}`
    setProcessingAction({ userId, type: 'approve' })
    setError(null)

    try {
      messageApi.open({
        key: notificationKey,
        type: 'loading',
        content: t('pendingApprovals.actions.approveLoading'),
        duration: 0,
      })
      const approvalResult = await approvePendingApproval(userId, token)
      setApprovals((currentApprovals) => currentApprovals.filter((approval) => approval.id !== userId))
      setApprovedAccountDetails(approvalResult)
      messageApi.success({
        key: notificationKey,
        content: t('pendingApprovals.actions.approveSuccess'),
        duration: 2,
      })
    } catch (actionError) {
      messageApi.destroy(notificationKey)
      setError(actionError instanceof Error ? actionError.message : t('pendingApprovals.errors.unknown'))
    } finally {
      setProcessingAction(null)
    }
  }

  const handleReject = async (userId: string) => {
    if (!token) {
      return
    }

    setProcessingAction({ userId, type: 'reject' })
    setError(null)

    try {
      await rejectPendingApproval(userId, token)
      setApprovals((currentApprovals) => currentApprovals.filter((approval) => approval.id !== userId))
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : t('pendingApprovals.errors.unknown'))
    } finally {
      setProcessingAction(null)
    }
  }

  const dateTimeLocale = language === 'pt' ? 'pt-PT' : 'en-GB'

  const columns: ColumnsType<PendingApproval> = [
    {
      title: t('pendingApprovals.table.email'),
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: t('pendingApprovals.table.requestedAt'),
      dataIndex: 'requestedAt',
      key: 'requestedAt',
      render: (value: string) => (
        <span className={styles.requestedAtCell}>
          {formatRequestedAt(value, dateTimeLocale, t)}
          {isRequestStale(value) ? (
            <FontAwesomeIcon
              icon={faTriangleExclamation}
              className={styles.requestWarning}
              title={t('pendingApprovals.table.requestStaleHint')}
            />
          ) : null}
        </span>
      ),
    },
    {
      title: t('pendingApprovals.table.actions'),
      key: 'actions',
      render: (_, approval) => (
        <div className={styles.actions}>
          <Button
            type="primary"
            className={styles.approveButton}
            disabled={processingAction?.userId === approval.id}
            onClick={() => void handleApprove(approval.id)}
          >
            {t('pendingApprovals.actions.approve')}
          </Button>
          <Popconfirm
            title={t('pendingApprovals.rejectConfirm.title')}
            description={t('pendingApprovals.rejectConfirm.description')}
            okText={t('pendingApprovals.rejectConfirm.ok')}
            cancelText={t('pendingApprovals.rejectConfirm.cancel')}
            onConfirm={() => void handleReject(approval.id)}
            disabled={processingAction?.userId === approval.id}
          >
            <Button
              danger
              loading={processingAction?.userId === approval.id && processingAction.type === 'reject'}
              disabled={processingAction?.userId === approval.id && processingAction.type === 'approve'}
            >
              {t('pendingApprovals.actions.reject')}
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ]

  return (
    <>
      {contextHolder}
      <div className={styles.page}>
        <div className={styles.pageHeader}>
          <div>
            <Title level={1} className={styles.pageTitle}>{t('pendingApprovals.title')}</Title>
          </div>

          <div className={styles.summaryBadge}>
            <span className={styles.summaryLabel}>{t('pendingApprovals.summaryLabel')}</span>
            <span className={styles.summaryValue}>{filteredApprovals.length}</span>
          </div>
        </div>

        {isLoading ? (
          <Card className={styles.loadingCard} variant="borderless">
            <div className={styles.loadingState}>
              <Space size="middle">
                <Spin />
                <span className={styles.loadingText}>{t('pendingApprovals.loading')}</span>
              </Space>
            </div>
          </Card>
        ) : null}

        {error ? (
          <Alert type="error" showIcon message={t('pendingApprovals.errorTitle')} description={error} />
        ) : null}

        <Modal
          open={approvedAccountDetails !== null}
          title={t('pendingApprovals.modal.title')}
          onCancel={() => setApprovedAccountDetails(null)}
          footer={[
            <Button key="close" type="primary" className={styles.approveButton} onClick={() => setApprovedAccountDetails(null)}>
              {t('pendingApprovals.modal.close')}
            </Button>,
          ]}
        >
          <p className={styles.temporaryPasswordHelp}>
            {t('pendingApprovals.modal.help')}
          </p>
          <div className={styles.temporaryPasswordPanel}>
            <span className={styles.temporaryPasswordLabel}>{t('pendingApprovals.modal.userLabel')}</span>
            <strong>{approvedAccountDetails?.email}</strong>
          </div>
          <div className={styles.temporaryPasswordPanel}>
            <span className={styles.temporaryPasswordLabel}>{t('pendingApprovals.modal.passwordLabel')}</span>
            <Typography.Text copyable={{ text: approvedAccountDetails?.temporaryPassword ?? '' }} className={styles.temporaryPasswordValue}>
              {approvedAccountDetails?.temporaryPassword}
            </Typography.Text>
          </div>
        </Modal>

        {!isLoading ? (
          <div className={styles.contentLayout}>
            <div className={styles.tableSection}>
              <Card className={styles.pageCard} variant="borderless">
                {filteredApprovals.length === 0 ? (
                  <div className={styles.emptyWrap}>
                    <Empty description={approvals.length === 0 ? t('pendingApprovals.empty.none') : t('pendingApprovals.empty.noMatches')} />
                  </div>
                ) : (
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
                )}
              </Card>
            </div>

            <aside className={styles.sidebar}>
              <div className={styles.sidebarCard}>
                <div className={styles.sidebarHeader}>
                  <h3 className={styles.sidebarTitle}>{t('pendingApprovals.filters.title')}</h3>
                  {shouldShowClearFiltersButton ? (
                    <Button
                      type="text"
                      className={styles.clearButton}
                      icon={<FontAwesomeIcon icon={faBroom} />}
                      title={t('pendingApprovals.filters.clear')}
                      aria-label={t('pendingApprovals.filters.clear')}
                      onClick={() => {
                        setSearch('')
                        setOlderThanThreeDays(false)
                      }}
                    />
                  ) : null}
                </div>

                <div className={styles.sidebarDivider} />

                <label className={styles.filterField}>
                  <span className={styles.filterLabel}>{t('pendingApprovals.filters.emailLabel')}</span>
                  <Input
                    allowClear
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder={t('pendingApprovals.filters.emailPlaceholder')}
                    className={styles.searchInput}
                    suffix={<FontAwesomeIcon icon={faMagnifyingGlass} />}
                  />
                </label>

                <CheckboxFilterSection
                  title={t('pendingApprovals.filters.ageTitle')}
                  count={olderThanThreeDays ? 1 : 0}
                  isOpen={isAgeOpen}
                  onToggle={() => setIsAgeOpen((current) => !current)}
                  toggleLabel={t(isAgeOpen ? 'pendingApprovals.filters.toggle.collapse' : 'pendingApprovals.filters.toggle.expand', { section: t('pendingApprovals.filters.ageTitle') })}
                >
                  <div className={styles.checkboxList}>
                    <label className={styles.checkboxOption}>
                      <Checkbox
                        checked={olderThanThreeDays}
                        onChange={(event) => setOlderThanThreeDays(event.target.checked)}
                      />
                      <span className={styles.checkboxOptionLabel}>{t('pendingApprovals.filters.olderThanThreeDays')}</span>
                    </label>
                  </div>
                </CheckboxFilterSection>
              </div>
            </aside>
          </div>
        ) : null}
      </div>
    </>
  )
}

import { faAngleDown, faAngleUp, faBroom, faMagnifyingGlass, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { Alert, Button, Card, Checkbox, Empty, Input, Space, Spin, Table, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useAuth } from '../../features/auth'
import { fetchAdminUsers, type AdminUserListItem } from '../../features/admin'
import { STORAGE_KEYS } from '../../constants/storage'
import styles from './UserListPage.module.css'

const { Title } = Typography

type PersistedUserListFiltersState = {
  search: string
  onlyAdmins: boolean
  staleOnly: boolean
  isRoleOpen: boolean
  isActivityOpen: boolean
}

function readPersistedUserListFilters(): PersistedUserListFiltersState | null {
  if (typeof window === 'undefined') {
    return null
  }

  const rawValue = window.sessionStorage.getItem(STORAGE_KEYS.userListFilters)
  if (!rawValue) {
    return null
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<PersistedUserListFiltersState>
    return {
      search: typeof parsed.search === 'string' ? parsed.search : '',
      onlyAdmins: parsed.onlyAdmins ?? false,
      staleOnly: parsed.staleOnly ?? false,
      isRoleOpen: parsed.isRoleOpen ?? true,
      isActivityOpen: parsed.isActivityOpen ?? true,
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
  children: React.ReactNode
}

function CheckboxFilterSection({
  title,
  count,
  isOpen,
  onToggle,
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
          aria-label={isOpen ? `Collapse ${title}` : `Expand ${title}`}
        >
          <FontAwesomeIcon icon={isOpen ? faAngleUp : faAngleDown} className={styles.checkboxSectionIcon} />
        </button>
      </div>

      {isOpen ? <div className={styles.checkboxSectionBody}>{children}</div> : null}
    </div>
  )
}

function formatLastLogin(value: string | null) {
  if (!value) {
    return 'Never'
  }

  const lastLoginAt = new Date(value)
  const now = new Date()
  const diffMs = now.getTime() - lastLoginAt.getTime()

  if (Number.isNaN(lastLoginAt.getTime()) || diffMs < 0) {
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

function isLastLoginStale(value: string | null) {
  if (!value) {
    return false
  }

  const lastLoginAt = new Date(value)
  const now = new Date()
  const diffMs = now.getTime() - lastLoginAt.getTime()
  const yearMs = 365 * 24 * 60 * 60 * 1000

  if (Number.isNaN(lastLoginAt.getTime()) || diffMs < 0) {
    return false
  }

  return diffMs >= yearMs
}

export function UserListPage() {
  const { token } = useAuth()
  const persistedFilters = useMemo(() => readPersistedUserListFilters(), [])
  const isPageRefreshRef = useRef(false)
  const [users, setUsers] = useState<AdminUserListItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState(persistedFilters?.search ?? '')
  const [onlyAdmins, setOnlyAdmins] = useState(persistedFilters?.onlyAdmins ?? false)
  const [staleOnly, setStaleOnly] = useState(persistedFilters?.staleOnly ?? false)
  const [isRoleOpen, setIsRoleOpen] = useState(persistedFilters?.isRoleOpen ?? true)
  const [isActivityOpen, setIsActivityOpen] = useState(persistedFilters?.isActivityOpen ?? true)
  const deferredSearch = useDeferredValue(search)
  const normalizedSearch = search.trim().toLowerCase()
  const shouldShowClearFiltersButton = search.trim().length > 0 || onlyAdmins || staleOnly
  const filteredUsers = users.filter((user) => {
    const matchesEmail = !normalizedSearch || user.email.toLowerCase().includes(normalizedSearch)
    const matchesRole = !onlyAdmins || user.role === 'ADMIN'
    const matchesStale = !staleOnly || isLastLoginStale(user.lastLoginAt)

    return matchesEmail && matchesRole && matchesStale
  })

  useEffect(() => {
    const loadUsers = async () => {
      if (!token) {
        setUsers([])
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        const data = await fetchAdminUsers(token, {
          search: deferredSearch,
          onlyAdmins,
          staleOnly,
        })
        setUsers(data)
        setError(null)
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unknown error')
      } finally {
        setIsLoading(false)
      }
    }

    void loadUsers()
  }, [token, deferredSearch, onlyAdmins, staleOnly])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.sessionStorage.setItem(STORAGE_KEYS.userListFilters, JSON.stringify({
      search,
      onlyAdmins,
      staleOnly,
      isRoleOpen,
      isActivityOpen,
    } satisfies PersistedUserListFiltersState))
  }, [isActivityOpen, isRoleOpen, onlyAdmins, search, staleOnly])

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
        window.sessionStorage.removeItem(STORAGE_KEYS.userListFilters)
      }
    }
  }, [])

  const columns: ColumnsType<AdminUserListItem> = [
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (value: AdminUserListItem['role']) => (
        <span className={`${styles.roleTag} ${value === 'USER' ? styles.roleTagUser : ''}`.trim()}>
          {value}
        </span>
      ),
    },
    {
      title: 'Last login',
      dataIndex: 'lastLoginAt',
      key: 'lastLoginAt',
      render: (value: string | null) => (
        <span className={styles.lastLoginCell}>
          {formatLastLogin(value)}
          {isLastLoginStale(value) ? (
            <FontAwesomeIcon
              icon={faTriangleExclamation}
              className={styles.lastLoginWarning}
              title="Last login is older than one year"
            />
          ) : null}
        </span>
      ),
    },
  ]

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <Title level={1} className={styles.pageTitle}>Users</Title>
        </div>

        <div className={styles.summaryBadge}>
          <span className={styles.summaryLabel}>Users</span>
          <span className={styles.summaryValue}>{filteredUsers.length}</span>
        </div>
      </div>

      {isLoading ? (
        <Card className={styles.loadingCard} variant="borderless">
          <div className={styles.loadingState}>
            <Space size="middle">
              <Spin />
              <span className={styles.loadingText}>Loading users</span>
            </Space>
          </div>
        </Card>
      ) : null}

      {error ? (
        <Alert type="error" showIcon message="Could not load users" description={error} />
      ) : null}

      {!isLoading ? (
        <div className={styles.contentLayout}>
          <div className={styles.tableSection}>
            <Card className={styles.pageCard} variant="borderless">
              {filteredUsers.length === 0 ? (
                <div className={styles.emptyWrap}>
                  <Empty description={users.length === 0 ? 'No active users.' : 'No users match the current filters.'} />
                </div>
              ) : (
                <Table
                  rowKey="id"
                  columns={columns}
                  dataSource={filteredUsers}
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
                <h3 className={styles.sidebarTitle}>Filters</h3>
                {shouldShowClearFiltersButton ? (
                  <Button
                    type="text"
                    className={styles.clearButton}
                    icon={<FontAwesomeIcon icon={faBroom} />}
                    title="Clear filters"
                    aria-label="Clear filters"
                    onClick={() => {
                      setSearch('')
                      setOnlyAdmins(false)
                      setStaleOnly(false)
                    }}
                  />
                ) : null}
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
                  suffix={<FontAwesomeIcon icon={faMagnifyingGlass} />}
                />
              </label>

              <CheckboxFilterSection
                title="Role"
                count={onlyAdmins ? 1 : 0}
                isOpen={isRoleOpen}
                onToggle={() => setIsRoleOpen((current) => !current)}
              >
                <div className={styles.checkboxList}>
                  <label className={styles.checkboxOption}>
                    <Checkbox checked={onlyAdmins} onChange={(event) => setOnlyAdmins(event.target.checked)} />
                    <span className={styles.checkboxOptionLabel}>Only admins</span>
                  </label>
                </div>
              </CheckboxFilterSection>

              <CheckboxFilterSection
                title="Activity"
                count={staleOnly ? 1 : 0}
                isOpen={isActivityOpen}
                onToggle={() => setIsActivityOpen((current) => !current)}
              >
                <div className={styles.checkboxList}>
                  <label className={styles.checkboxOption}>
                    <Checkbox checked={staleOnly} onChange={(event) => setStaleOnly(event.target.checked)} />
                    <span className={styles.checkboxOptionLabel}>Inactive for over 1 year</span>
                  </label>
                </div>
              </CheckboxFilterSection>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  )
}

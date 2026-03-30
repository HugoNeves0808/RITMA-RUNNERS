import { faBroom, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useDeferredValue, useEffect, useState } from 'react'
import { Alert, Button, Card, Checkbox, Empty, Input, Space, Spin, Table, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useAuth } from '../../features/auth'
import { fetchAdminUsers, type AdminUserListItem } from '../../features/admin'
import styles from './UserListPage.module.css'

const { Title } = Typography

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
  const [users, setUsers] = useState<AdminUserListItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [onlyAdmins, setOnlyAdmins] = useState(false)
  const [staleOnly, setStaleOnly] = useState(false)
  const deferredSearch = useDeferredValue(search)
  const normalizedSearch = search.trim().toLowerCase()
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
        <Space>
          <Spin size="small" />
          <span>Loading users</span>
        </Space>
      ) : null}

      {error ? (
        <Alert type="error" showIcon message="Could not load users" description={error} />
      ) : null}

      <div className={styles.contentLayout}>
        <div className={styles.tableSection}>
          <Card className={styles.pageCard} variant="borderless">
            {!isLoading && filteredUsers.length === 0 ? (
              <div className={styles.emptyWrap}>
                <Empty description={users.length === 0 ? 'No active users.' : 'No users match the current filters.'} />
              </div>
            ) : null}

            {!isLoading && filteredUsers.length > 0 ? (
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
                  setOnlyAdmins(false)
                  setStaleOnly(false)
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
              <Checkbox checked={onlyAdmins} onChange={(event) => setOnlyAdmins(event.target.checked)}>
                Only admins
              </Checkbox>
            </label>

            <label className={styles.checkboxField}>
              <Checkbox checked={staleOnly} onChange={(event) => setStaleOnly(event.target.checked)}>
                Inactive for over 1 year
              </Checkbox>
            </label>
          </div>
        </aside>
      </div>
    </div>
  )
}

import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useEffect, useState } from 'react'
import { Alert, Card, Space, Spin, Table, Typography } from 'antd'
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

  useEffect(() => {
    const loadUsers = async () => {
      if (!token) {
        setUsers([])
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        const data = await fetchAdminUsers(token)
        setUsers(data)
        setError(null)
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unknown error')
      } finally {
        setIsLoading(false)
      }
    }

    void loadUsers()
  }, [token])

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
    <Card className={styles.pageCard} variant="borderless">
      <div className={styles.header}>
        <div>
          <Title level={2}>Users</Title>
        </div>

        <div className={styles.summaryBadge}>
          <span className={styles.summaryLabel}>Users</span>
          <span className={styles.summaryValue}>{users.length}</span>
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

      {!isLoading ? (
        <Table
          rowKey="id"
          columns={columns}
          dataSource={users}
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            hideOnSinglePage: true,
          }}
          locale={{ emptyText: 'No active users.' }}
        />
      ) : null}
    </Card>
  )
}

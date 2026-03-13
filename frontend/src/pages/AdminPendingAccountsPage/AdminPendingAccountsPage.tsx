import { useEffect, useState } from 'react'
import { Alert, Button, Card, Popconfirm, Space, Spin, Table, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useAuth } from '../../features/auth'
import {
  approvePendingAccount,
  fetchPendingAccounts,
  rejectPendingAccount,
  type PendingAccount,
} from '../../features/admin'
import styles from './AdminPendingAccountsPage.module.css'

const { Paragraph, Title } = Typography

export function AdminPendingAccountsPage() {
  const { token } = useAuth()
  const [accounts, setAccounts] = useState<PendingAccount[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    const loadPendingAccounts = async () => {
      try {
        const data = await fetchPendingAccounts(token ?? '')
        setAccounts(data)
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unknown error')
      } finally {
        setIsLoading(false)
      }
    }

    void loadPendingAccounts()
  }, [token])

  const handleApprove = async (userId: string) => {
    if (!token) {
      return
    }

    setProcessingId(userId)
    setError(null)

    try {
      await approvePendingAccount(userId, token)
      setAccounts((currentAccounts) => currentAccounts.filter((account) => account.id !== userId))
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
      await rejectPendingAccount(userId, token)
      setAccounts((currentAccounts) => currentAccounts.filter((account) => account.id !== userId))
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Unknown error')
    } finally {
      setProcessingId(null)
    }
  }

  const columns: ColumnsType<PendingAccount> = [
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Status',
      dataIndex: 'accountStatus',
      key: 'accountStatus',
    },
    {
      title: 'Requested at',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (value: string) => new Date(value).toLocaleString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, account) => (
        <div className={styles.actions}>
          <Button
            type="primary"
            loading={processingId === account.id}
            onClick={() => void handleApprove(account.id)}
          >
            Approve
          </Button>
          <Popconfirm
            title="Reject request"
            description="This will delete the pending account request."
            okText="Reject"
            cancelText="Cancel"
            onConfirm={() => void handleReject(account.id)}
          >
            <Button danger loading={processingId === account.id}>
              Reject
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ]

  return (
    <Card className={styles.pageCard} variant="borderless">
      <Title level={2}>Pending account requests</Title>
      <Paragraph>
        Temporary admin page to review new account requests before activation.
      </Paragraph>
      {isLoading ? (
        <Space>
          <Spin size="small" />
          <span>Loading pending account requests</span>
        </Space>
      ) : null}
      {error ? (
        <Alert type="error" showIcon message="Could not process account requests" description={error} />
      ) : null}
      {!isLoading ? (
        <Table
          rowKey="id"
          columns={columns}
          dataSource={accounts}
          pagination={false}
          locale={{ emptyText: 'No pending account requests.' }}
        />
      ) : null}
    </Card>
  )
}

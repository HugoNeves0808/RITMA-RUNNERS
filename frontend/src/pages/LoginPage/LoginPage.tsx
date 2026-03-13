import { useState } from 'react'
import { Alert, Button, Card, Checkbox, Form, Input, Space, Typography } from 'antd'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'
import { RequestAccountModal, useAuth } from '../../features/auth'
import styles from './LoginPage.module.css'

const { Link, Paragraph, Title } = Typography

type LoginFormValues = {
  email: string
  password: string
  rememberPassword?: boolean
}

export function LoginPage() {
  const { login, isAuthenticated, isAdmin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRequestAccountOpen, setIsRequestAccountOpen] = useState(false)

  const redirectTarget = isAuthenticated && isAdmin ? ROUTES.adminDiagnostics : ROUTES.home
  const requestedTarget = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname

  if (isAuthenticated) {
    return <Navigate to={requestedTarget ?? redirectTarget} replace />
  }

  const handleFinish = async (values: LoginFormValues) => {
    setError(null)
    setIsSubmitting(true)

    try {
      await login(values)
      navigate(requestedTarget ?? ROUTES.home, { replace: true })
    } catch (loginError) {
      setError(getLoginErrorMessage(loginError))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={styles.page}>
      <img src="/images/ritma-logo.png" alt="RITMA RUNNERS" className={styles.cornerLogo} />

      <div className={styles.split}>
        <Card className={`${styles.card} ${styles.formCard}`} variant="borderless">
          <Space direction="vertical" size={10} className={styles.header}>
            <div>
              <Title level={2} className={styles.title}>
                Welcome back to RITMA
              </Title>
            </div>
          </Space>

          {error ? (
            <Alert
              type="error"
              showIcon
              message="Login failed"
              description={error}
              style={{ marginBottom: 16 }}
            />
          ) : null}

          <Form<LoginFormValues> layout="vertical" onFinish={handleFinish}>
            <Form.Item label="Email" name="email" rules={[{ required: true, type: 'email' }]}>
              <Input placeholder="admin@ritma.com" size="large" />
            </Form.Item>

            <Form.Item label="Password" name="password" rules={[{ required: true }]}>
              <Input.Password placeholder="Enter your password" size="large" />
            </Form.Item>

            <div className={styles.metaRow}>
              <Form.Item name="rememberPassword" valuePropName="checked" noStyle>
                <Checkbox>Remember password</Checkbox>
              </Form.Item>
              <Link className={styles.secondaryLink} onClick={() => setIsRequestAccountOpen(true)}>
                Request account
              </Link>
            </div>

            <Button type="primary" htmlType="submit" size="large" loading={isSubmitting} block>
              Sign in
            </Button>
          </Form>
        </Card>

        <div className={styles.sidePanel}>
          <div className={styles.sideContent}>
            <Paragraph className={styles.sideIntro}>With RITMA, you will be able to...</Paragraph>
            <div className={styles.sidePoints}>
              <div className={styles.sidePoint}>
                <img
                  src="/icons/circle-check-solid-full.svg"
                  alt=""
                  aria-hidden="true"
                  className={styles.sidePointIcon}
                />
                <Paragraph className={styles.sideCopy}>
                  Manage your races in one place, with everything organized in a simple way.
                </Paragraph>
              </div>
              <div className={styles.sidePoint}>
                <img
                  src="/icons/circle-check-solid-full.svg"
                  alt=""
                  aria-hidden="true"
                  className={styles.sidePointIcon}
                />
                <Paragraph className={styles.sideCopy}>
                  Track results, progress, and history without losing context between seasons.
                </Paragraph>
              </div>
              <div className={styles.sidePoint}>
                <img
                  src="/icons/circle-check-solid-full.svg"
                  alt=""
                  aria-hidden="true"
                  className={styles.sidePointIcon}
                />
                <Paragraph className={styles.sideCopy}>
                  Identify your best performances and see where you are improving.
                </Paragraph>
              </div>
            </div>
          </div>
        </div>
      </div>

      <RequestAccountModal
        open={isRequestAccountOpen}
        onCancel={() => setIsRequestAccountOpen(false)}
      />
    </div>
  )
}

function getLoginErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return 'Unable to sign in right now. Please try again.'
  }

  if (error.message === 'HTTP 401') {
    return 'Invalid email or password.'
  }

  if (error.message === 'Invalid email or password') {
    return error.message
  }

  return 'Unable to sign in right now. Please try again.'
}

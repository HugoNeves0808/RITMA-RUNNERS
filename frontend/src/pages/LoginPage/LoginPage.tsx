import { useState } from 'react'
import { faBuffer } from '@fortawesome/free-brands-svg-icons'
import { faArrowTrendUp, faRankingStar, faRightToBracket, faWrench } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Alert, Button, Card, Checkbox, Form, Input, Space, Typography } from 'antd'
import { Link as RouterLink, Navigate, useLocation, useNavigate } from 'react-router-dom'
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
      await login(
        {
          email: values.email,
          password: values.password,
        },
        {
          remember: values.rememberPassword ?? false,
        },
      )
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
              <Input placeholder="Enter your email" size="large" />
            </Form.Item>

            <Form.Item label="Password" name="password" rules={[{ required: true }]}>
              <Input.Password placeholder="Enter your password" size="large" />
            </Form.Item>

            <div className={styles.metaRow}>
              <Form.Item name="rememberPassword" valuePropName="checked" noStyle>
                <Checkbox>Remember me</Checkbox>
              </Form.Item>
              <Link className={styles.secondaryLink} onClick={() => setIsRequestAccountOpen(true)}>
                Request account
              </Link>
            </div>

            <Button
              className={styles.primaryButton}
              type="primary"
              htmlType="submit"
              size="large"
              icon={<FontAwesomeIcon icon={faRightToBracket} />}
              loading={isSubmitting}
              block
            >
              Sign in
            </Button>
          </Form>
        </Card>

        <div className={styles.sidePanel}>
          <div className={styles.sideContent}>
            <div className={styles.sidePoints}>
              <div className={styles.sidePoint}>
                <FontAwesomeIcon icon={faBuffer} className={styles.sidePointIcon} />
                <Paragraph className={styles.sideCopy}>
                  Manage your races in one place
                </Paragraph>
              </div>
              <div className={styles.sidePoint}>
                <FontAwesomeIcon icon={faArrowTrendUp} className={styles.sidePointIcon} />
                <Paragraph className={styles.sideCopy}>
                  Track results, progress, and history
                </Paragraph>
              </div>
              <div className={styles.sidePoint}>
                <FontAwesomeIcon icon={faRankingStar} className={styles.sidePointIcon} />
                <Paragraph className={styles.sideCopy}>
                  Identify your best performances
                </Paragraph>
              </div>
            </div>
            <div className={styles.sideDevelopment}>
              <FontAwesomeIcon icon={faWrench} className={styles.sideDevelopmentIcon} />
              <Paragraph className={styles.sideDevelopmentCopy}>
                RITMA is still in development.{' '}
                <RouterLink to={ROUTES.futureGoals} className={styles.sideDevelopmentLink}>
                  See what is planned next.
                </RouterLink>
              </Paragraph>
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

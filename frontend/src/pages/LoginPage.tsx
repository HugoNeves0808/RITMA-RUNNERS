import { useState } from 'react'
import { Alert, Button, Card, Checkbox, Form, Input, Space, Typography } from 'antd'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ROUTES } from '../constants/routes'
import { useAuth } from '../hooks/useAuth'

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
      setError(loginError instanceof Error ? loginError.message : 'Login failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <img src="/images/ritma-logo.png" alt="RITMA RUNNERS" className="auth-corner-logo" />

      <div className="auth-split">
        <Card className="auth-card auth-form-card" variant="borderless">
          <Space direction="vertical" size={10} className="auth-card-header">
            <div>
              <Title level={2} className="auth-title">
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

            <div className="auth-meta-row">
              <Form.Item name="rememberPassword" valuePropName="checked" noStyle>
                <Checkbox>Remember password</Checkbox>
              </Form.Item>
              <Link className="auth-secondary-link">Request account</Link>
            </div>

            <Button type="primary" htmlType="submit" size="large" loading={isSubmitting} block>
              Sign in
            </Button>
          </Form>
        </Card>

        <div className="auth-side-panel">
          <div className="auth-side-content">
            <Paragraph className="auth-side-intro">With RITMA, you will be able to...</Paragraph>
            <div className="auth-side-points">
              <div className="auth-side-point">
                <img
                  src="/icons/circle-check-solid-full.svg"
                  alt=""
                  aria-hidden="true"
                  className="auth-side-point-icon"
                />
                <Paragraph className="auth-side-copy">
                  Manage your races in one place, with everything organized in a simple way.
                </Paragraph>
              </div>
              <div className="auth-side-point">
                <img
                  src="/icons/circle-check-solid-full.svg"
                  alt=""
                  aria-hidden="true"
                  className="auth-side-point-icon"
                />
                <Paragraph className="auth-side-copy">
                  Track results, progress, and history without losing context between seasons.
                </Paragraph>
              </div>
              <div className="auth-side-point">
                <img
                  src="/icons/circle-check-solid-full.svg"
                  alt=""
                  aria-hidden="true"
                  className="auth-side-point-icon"
                />
                <Paragraph className="auth-side-copy">
                  Identify your best performances and see where you are improving.
                </Paragraph>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

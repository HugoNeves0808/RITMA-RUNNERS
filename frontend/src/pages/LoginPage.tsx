import { useState } from 'react'
import { Alert, Button, Card, Form, Input, Typography } from 'antd'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ROUTES } from '../constants/routes'
import { useAuth } from '../hooks/useAuth'

const { Paragraph, Title } = Typography

type LoginFormValues = {
  email: string
  password: string
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
    <Card className="auth-card" variant="borderless">
      <Title level={2}>Login</Title>
      <Paragraph>
        Authenticate with a JWT-backed session. The admin diagnostics page is only available to
        users with role <strong>ADMIN</strong>.
      </Paragraph>
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
        <Button type="primary" htmlType="submit" size="large" loading={isSubmitting} block>
          Sign in
        </Button>
      </Form>
    </Card>
  )
}

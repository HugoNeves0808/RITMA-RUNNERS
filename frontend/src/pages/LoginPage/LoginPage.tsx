import { useState } from 'react'
import { faBuffer } from '@fortawesome/free-brands-svg-icons'
import { faArrowTrendUp, faRankingStar, faRightToBracket } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Alert, Button, Card, Checkbox, Form, Input, Typography } from 'antd'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ROUTES } from '../../constants/routes'
import { RequestAccountModal, useAuth } from '../../features/auth'
import { isApiError } from '../../services/apiClient'
import styles from './LoginPage.module.css'

const { Link, Paragraph, Title } = Typography

type LoginFormValues = {
  email: string
  password: string
  rememberPassword?: boolean
}

export function LoginPage() {
  const { t } = useTranslation()
  const { login, isAuthenticated, isAdmin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRequestAccountOpen, setIsRequestAccountOpen] = useState(false)

  const redirectTarget = isAuthenticated && isAdmin ? ROUTES.adminRitmaOverview : ROUTES.races
  const requestedTarget = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname

  if (isAuthenticated) {
    return <Navigate to={requestedTarget ?? redirectTarget} replace />
  }

  const handleFinish = async (values: LoginFormValues) => {
    setError(null)
    setIsSubmitting(true)

    try {
      const authenticatedUser = await login(
        {
          email: values.email,
          password: values.password,
        },
        {
          remember: values.rememberPassword ?? false,
        },
      )
      navigate(
        requestedTarget ?? (authenticatedUser.role === 'ADMIN' ? ROUTES.adminRitmaOverview : ROUTES.races),
        { replace: true },
      )
    } catch (loginError) {
      setError(getLoginErrorMessage(loginError, t))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={styles.page}>
      <img src="/images/ritma-logo.png" alt="RITMA RUNNERS" className={styles.cornerLogo} />

      <div className={styles.split}>
        <Card className={`${styles.card} ${styles.formCard}`} variant="borderless">
          <div className={styles.header}>
            <Title level={2} className={styles.title}>
              {t('login.welcomeTitle')}
            </Title>
          </div>

          {error ? (
            <Alert
              type="error"
              showIcon
              message={t('login.alertTitle')}
              description={error}
              style={{ marginBottom: 16 }}
            />
          ) : null}

          <Form<LoginFormValues> layout="vertical" onFinish={handleFinish}>
            <Form.Item
              label={t('login.emailLabel')}
              name="email"
              validateTrigger="onBlur"
              rules={[
                { required: true, message: t('login.emailRequired') },
                { type: 'email', message: t('login.emailInvalid') },
              ]}
            >
              <Input placeholder={t('login.emailPlaceholder')} size="large" />
            </Form.Item>

            <Form.Item
              label={t('login.passwordLabel')}
              name="password"
              rules={[{ required: true, message: t('login.passwordRequired') }]}
            >
              <Input.Password placeholder={t('login.passwordPlaceholder')} size="large" />
            </Form.Item>

            <div className={styles.metaRow}>
              <Form.Item name="rememberPassword" valuePropName="checked" noStyle>
                <Checkbox>{t('login.rememberMe')}</Checkbox>
              </Form.Item>
              <Link className={styles.secondaryLink} onClick={() => setIsRequestAccountOpen(true)}>
                {t('login.requestAccount')}
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
              {t('login.signIn')}
            </Button>
          </Form>
        </Card>

        <div className={styles.sidePanel}>
          <div className={styles.sideContent}>
            <div className={styles.sidePoints}>
              <div className={styles.sidePoint}>
                <FontAwesomeIcon icon={faBuffer} className={styles.sidePointIcon} />
                <Paragraph className={styles.sideCopy}>
                  {t('login.sideManageRaces')}
                </Paragraph>
              </div>
              <div className={styles.sidePoint}>
                <FontAwesomeIcon icon={faArrowTrendUp} className={styles.sidePointIcon} />
                <Paragraph className={styles.sideCopy}>
                  {t('login.sideTrackProgress')}
                </Paragraph>
              </div>
              <div className={styles.sidePoint}>
                <FontAwesomeIcon icon={faRankingStar} className={styles.sidePointIcon} />
                <Paragraph className={styles.sideCopy}>
                  {t('login.sideBestPerformances')}
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

function getLoginErrorMessage(error: unknown, t: (key: string) => string) {
  if (!(error instanceof Error)) {
    return t('login.errors.generic')
  }

  if (isApiError(error) && error.status === 401) {
    return t('login.errors.invalidCredentials')
  }

  if (error.message === 'Invalid email or password') {
    return t('login.errors.invalidCredentials')
  }

  return t('login.errors.generic')
}

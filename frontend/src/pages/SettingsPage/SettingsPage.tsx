import { faAngleDown, faKey, faUserGear } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useMemo, useState } from 'react'
import { Alert, Button, Card, Form, Input, Switch, Typography } from 'antd'
import { isApiError } from '../../services/apiClient'
import { useAuth } from '../../features/auth'
import styles from './SettingsPage.module.css'

const { Title } = Typography

type ChangePasswordFormValues = {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

type SettingsSectionKey = 'password' | 'preferences'

export function SettingsPage() {
  const { submitPasswordChange, rememberSession, updateRememberSession } = useAuth()
  const [form] = Form.useForm<ChangePasswordFormValues>()
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false)
  const [activeSection, setActiveSection] = useState<SettingsSectionKey>('password')
  const [openSections, setOpenSections] = useState<Record<SettingsSectionKey, boolean>>({
    password: true,
    preferences: true,
  })

  const sections = useMemo(() => ([
    {
      key: 'password' as const,
      eyebrow: 'Security',
      title: '',
      icon: faKey,
    },
    {
      key: 'preferences' as const,
      eyebrow: 'Preferences',
      title: '',
      icon: faUserGear,
    },
  ]), [])

  const activeSectionTitle = activeSection === 'password'
    ? 'Change password'
    : 'Local preferences'

  const toggleActiveSection = () => {
    setOpenSections((current) => ({
      ...current,
      [activeSection]: !current[activeSection],
    }))
  }

  const handlePasswordSubmit = async () => {
    setPasswordError(null)
    setPasswordSuccess(null)

    try {
      const values = await form.validateFields()
      setIsSubmittingPassword(true)

      await submitPasswordChange({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      })

      form.resetFields()
      setPasswordSuccess('Your password was updated successfully.')
    } catch (submitError) {
      if (typeof submitError === 'object' && submitError !== null && 'errorFields' in submitError) {
        return
      }

      if (submitError instanceof Error) {
        if (submitError.message === 'Current password is incorrect') {
          setPasswordError('Current password is incorrect.')
          return
        }

        if (
          submitError.message === 'Choose a stronger password.'
          || submitError.message === 'Use at least 8 characters, including uppercase, lowercase, a number, and a symbol.'
        ) {
          setPasswordError('Use at least 8 characters, including uppercase, lowercase, a number, and a symbol.')
          return
        }

        if (submitError.message === 'New password must be different from the current password.') {
          setPasswordError('The new password cannot be the same as the current password.')
          return
        }

        if (isApiError(submitError) && submitError.status === 401) {
          setPasswordError('Your session expired. Sign in again and try once more.')
          return
        }

        setPasswordError(submitError.message || 'Unable to update your password right now.')
        return
      }

      setPasswordError('Unable to update your password right now.')
    } finally {
      setIsSubmittingPassword(false)
    }
  }

  return (
    <div className={styles.page}>
      <Title level={1} className={styles.title}>Settings</Title>

      <div className={styles.layout}>
        <Card className={styles.sidebarCard} bordered={false}>
          <div className={styles.sidebarList}>
            {sections.map((section) => (
              <button
                key={section.key}
                type="button"
                className={activeSection === section.key ? `${styles.sidebarItem} ${styles.sidebarItemActive}` : styles.sidebarItem}
                onClick={() => setActiveSection(section.key)}
              >
                <span className={styles.sidebarIcon}>
                  <FontAwesomeIcon icon={section.icon} />
                </span>
                <span className={styles.sidebarText}>
                  <span className={styles.sidebarEyebrow}>{section.eyebrow}</span>
                  <span className={styles.sidebarTitle}>{section.title}</span>
                </span>
              </button>
            ))}
          </div>
        </Card>

        <Card className={styles.contentCard} bordered={false}>
          <button type="button" className={styles.contentCollapseButton} onClick={toggleActiveSection}>
            <div className={styles.contentHeader}>
              <Title level={2} className={styles.contentTitle}>{activeSectionTitle}</Title>
            </div>
            <FontAwesomeIcon
              icon={faAngleDown}
              className={openSections[activeSection] ? styles.contentChevronOpen : styles.contentChevron}
            />
          </button>

          {activeSection === 'password' && openSections.password ? (
            <div className={styles.contentBody}>
              {passwordError ? (
                <Alert type="error" showIcon message="Unable to update password" description={passwordError} />
              ) : null}

              {passwordSuccess ? (
                <Alert type="success" showIcon message={passwordSuccess} />
              ) : null}

              <Form<ChangePasswordFormValues> form={form} layout="vertical">
                <Form.Item
                  label="Current password"
                  name="currentPassword"
                  rules={[{ required: true, message: 'Current password is required' }]}
                >
                  <Input.Password placeholder="Enter your current password" size="large" />
                </Form.Item>

                <Form.Item
                  label="New password"
                  name="newPassword"
                  dependencies={['currentPassword']}
                  validateTrigger={['onBlur', 'onSubmit']}
                  rules={[
                    { required: true, message: 'New password is required' },
                    { min: 8, message: 'Use at least 8 characters.' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value) {
                          return Promise.resolve()
                        }

                        return getFieldValue('currentPassword') === value
                          ? Promise.reject(new Error('The new password cannot be the same as the current password.'))
                          : Promise.resolve()
                      },
                    }),
                    {
                      validator(_, value) {
                        if (!value) {
                          return Promise.resolve()
                        }

                        const isStrongPassword =
                          /[a-z]/.test(value)
                          && /[A-Z]/.test(value)
                          && /\d/.test(value)
                          && /[^A-Za-z0-9]/.test(value)

                        return isStrongPassword
                          ? Promise.resolve()
                          : Promise.reject(new Error('Use uppercase, lowercase, a number, and a symbol.'))
                      },
                    },
                  ]}
                >
                  <Input.Password placeholder="Enter your new password" size="large" />
                </Form.Item>

                <Form.Item
                  label="Confirm new password"
                  name="confirmPassword"
                  dependencies={['newPassword']}
                  rules={[
                    { required: true, message: 'Please confirm the new password' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        return !value || getFieldValue('newPassword') === value
                          ? Promise.resolve()
                          : Promise.reject(new Error('The new passwords do not match'))
                      },
                    }),
                  ]}
                >
                  <Input.Password placeholder="Confirm your new password" size="large" />
                </Form.Item>

                <Button
                  type="primary"
                  className={styles.primaryButton}
                  loading={isSubmittingPassword}
                  onClick={() => void handlePasswordSubmit()}
                >
                  Update password
                </Button>
              </Form>
            </div>
          ) : null}

          {activeSection === 'preferences' && openSections.preferences ? (
            <div className={styles.contentBody}>
              <div className={styles.preferenceRow}>
                <div className={styles.preferenceInfo}>
                  <div className={styles.preferenceTitle}>Remember me</div>
                  <div className={styles.preferenceText}>Managed at sign-in and stored locally on this browser.</div>
                </div>
                <Switch
                  className={styles.preferenceSwitch}
                  checked={rememberSession}
                  checkedChildren="On"
                  unCheckedChildren="Off"
                  onChange={updateRememberSession}
                />
              </div>
            </div>
          ) : null}
        </Card>
      </div>
    </div>
  )
}

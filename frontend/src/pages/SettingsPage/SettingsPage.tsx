import { faAngleDown, faDatabase, faKey } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useState } from 'react'
import { Alert, Button, Card, Form, Input, Typography } from 'antd'
import { useTranslation } from 'react-i18next'
import { isApiError } from '../../services/apiClient'
import { useAuth } from '../../features/auth'
import { downloadSettingsExport } from '../../features/settings/services/settingsService'
import styles from './SettingsPage.module.css'

const { Title } = Typography

type ChangePasswordFormValues = {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

type SettingsSectionKey = 'password' | 'data'

export function SettingsPage() {
  const { t } = useTranslation()
  const { submitPasswordChange, token } = useAuth()
  const [form] = Form.useForm<ChangePasswordFormValues>()
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false)
  const [dataError, setDataError] = useState<string | null>(null)
  const [isExportingJson, setIsExportingJson] = useState(false)
  const [isExportingSql, setIsExportingSql] = useState(false)
  const [isExportingExcel, setIsExportingExcel] = useState(false)
  const [activeSection, setActiveSection] = useState<SettingsSectionKey>('password')
  const [openSections, setOpenSections] = useState<Record<SettingsSectionKey, boolean>>({
    password: true,
    data: true,
  })

  const activeSectionTitle = activeSection === 'password'
    ? t('settings.sections.changePassword')
    : t('settings.sections.data')

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

  const triggerDownload = async (format: 'json' | 'sql' | 'xlsx') => {
    if (!token) {
      return
    }

    try {
      setDataError(null)
      if (format === 'json') {
        setIsExportingJson(true)
      } else if (format === 'sql') {
        setIsExportingSql(true)
      } else {
        setIsExportingExcel(true)
      }

      const { blob, filename } = await downloadSettingsExport(format, token)
      const url = window.URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = filename
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      window.URL.revokeObjectURL(url)
    } catch (exportError) {
      setDataError(exportError instanceof Error ? exportError.message : t('settings.data.errors.export'))
    } finally {
      setIsExportingJson(false)
      setIsExportingSql(false)
      setIsExportingExcel(false)
    }
  }

  return (
    <div className={styles.page}>
      <Title level={1} className={styles.title}>{t('settings.title')}</Title>

      <div className={styles.layout}>
        <Card className={styles.sidebarCard} bordered={false}>
          <div className={styles.sidebarList}>
            <button
              type="button"
              className={`${styles.sidebarItem} ${styles.sidebarItemActive}`}
              onClick={() => setActiveSection('password')}
            >
              <span className={styles.sidebarIcon}>
                <FontAwesomeIcon icon={faKey} />
              </span>
              <span className={styles.sidebarText}>
                <span className={styles.sidebarEyebrow}>{t('settings.sidebar.securityEyebrow')}</span>
              </span>
            </button>
            <button
              type="button"
              className={`${styles.sidebarItem} ${activeSection === 'data' ? styles.sidebarItemActive : ''}`}
              onClick={() => setActiveSection('data')}
            >
              <span className={styles.sidebarIcon}>
                <FontAwesomeIcon icon={faDatabase} />
              </span>
              <span className={styles.sidebarText}>
                <span className={styles.sidebarEyebrow}>{t('settings.sidebar.dataEyebrow')}</span>
              </span>
            </button>
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
                <Alert type="error" showIcon message={t('forcePasswordChange.alertTitle')} description={passwordError} />
              ) : null}

              {passwordSuccess ? (
                <Alert type="success" showIcon message={passwordSuccess} />
              ) : null}

              <Form<ChangePasswordFormValues> form={form} layout="vertical">
                <Form.Item
                  label={t('forcePasswordChange.currentPasswordLabel')}
                  name="currentPassword"
                  rules={[{ required: true, message: t('forcePasswordChange.currentPasswordRequired') }]}
                >
                  <Input.Password placeholder={t('forcePasswordChange.currentPasswordPlaceholder')} size="large" />
                </Form.Item>

                <Form.Item
                  label={t('forcePasswordChange.newPasswordLabel')}
                  name="newPassword"
                  dependencies={['currentPassword']}
                  validateTrigger={['onBlur', 'onSubmit']}
                  rules={[
                    { required: true, message: t('forcePasswordChange.newPasswordRequired') },
                    { min: 8, message: t('forcePasswordChange.errors.weakPassword') },
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
                          : Promise.reject(new Error(t('forcePasswordChange.errors.weakPassword')))
                      },
                    },
                  ]}
                >
                  <Input.Password placeholder={t('forcePasswordChange.newPasswordPlaceholder')} size="large" />
                </Form.Item>

                <Form.Item
                  label={t('forcePasswordChange.confirmPasswordLabel')}
                  name="confirmPassword"
                  dependencies={['newPassword']}
                  rules={[
                    { required: true, message: t('forcePasswordChange.confirmPasswordRequired') },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        return !value || getFieldValue('newPassword') === value
                          ? Promise.resolve()
                          : Promise.reject(new Error(t('forcePasswordChange.errors.mismatch')))
                      },
                    }),
                  ]}
                >
                  <Input.Password placeholder={t('forcePasswordChange.confirmPasswordPlaceholder')} size="large" />
                </Form.Item>

                <Button
                  type="primary"
                  className={styles.primaryButton}
                  loading={isSubmittingPassword}
                  onClick={() => void handlePasswordSubmit()}
                >
                  {t('forcePasswordChange.updatePassword')}
                </Button>
              </Form>
            </div>
          ) : null}

          {activeSection === 'data' && openSections.data ? (
            <div className={styles.contentBody}>
              {dataError ? (
                <Alert type="error" showIcon message={t('settings.data.alertTitle')} description={dataError} />
              ) : null}

              <div className={styles.dataRows}>
                <div className={styles.dataRow}>
                  <span className={styles.dataRowLabel}>{t('settings.data.export.excelDescription')}</span>
                  <Button
                    className={styles.primaryButton}
                    type="primary"
                    loading={isExportingExcel}
                    onClick={() => void triggerDownload('xlsx')}
                  >
                    {t('settings.data.export.excel')}
                  </Button>
                </div>

                <div className={styles.dataRow}>
                  <span className={styles.dataRowLabel}>{t('settings.data.export.jsonDescription')}</span>
                  <Button
                    loading={isExportingJson}
                    onClick={() => void triggerDownload('json')}
                  >
                    {t('settings.data.export.json')}
                  </Button>
                </div>

                <div className={styles.dataRow}>
                  <span className={styles.dataRowLabel}>{t('settings.data.export.sqlDescription')}</span>
                  <Button
                    loading={isExportingSql}
                    onClick={() => void triggerDownload('sql')}
                  >
                    {t('settings.data.export.sql')}
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </Card>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { Alert, Button, Form, Input, Modal } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { ROUTES } from '../../../constants/routes'
import styles from './ForcePasswordChangeModal.module.css'

type ChangePasswordFormValues = {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export function ForcePasswordChangeModal() {
  const { user, submitPasswordChange, logout } = useAuth()
  const navigate = useNavigate()
  const [form] = Form.useForm<ChangePasswordFormValues>()
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPasswordHint, setShowPasswordHint] = useState(false)

  const isOpen = Boolean(user?.forcePasswordChange)
  const newPasswordValue = Form.useWatch('newPassword', form)

  const handleSubmit = async () => {
    setError(null)

    try {
      const values = await form.validateFields()
      setIsSubmitting(true)

      await submitPasswordChange({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      })

      form.resetFields()
      setShowPasswordHint(false)
    } catch (submitError) {
      if (
        typeof submitError === 'object'
        && submitError !== null
        && 'errorFields' in submitError
      ) {
        return
      }

      if (submitError instanceof Error) {
        if (submitError.message === 'Invalid user' || submitError.message === 'HTTP 401') {
          logout()
          navigate(ROUTES.login, { replace: true })
          return
        }

        if (submitError.message === 'Current password is incorrect') {
          setError('Current password is incorrect.')
          return
        }

        if (submitError.message === 'Choose a stronger password.') {
          setError('Choose a stronger password.')
          return
        }

        setError(submitError.message || 'Unable to change password right now. Please try again.')
        return
      }

      setError('Unable to change password right now. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {isOpen ? <div className={styles.overlay} /> : null}
      <Modal
        open={isOpen}
        title="Change password"
        closable={false}
        maskClosable={false}
        keyboard={false}
        footer={[
          <Button key="submit" type="primary" loading={isSubmitting} onClick={handleSubmit}>
            Update password
          </Button>,
        ]}
        destroyOnHidden
        rootClassName={styles.modal}
      >
        {error ? (
          <Alert
            type="error"
            showIcon
            message="Unable to update password"
            description={error}
            style={{ marginBottom: 16 }}
          />
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
            validateTrigger={['onBlur', 'onSubmit']}
            rules={[
              { required: true, message: 'New password is required' },
              { min: 8, message: 'Use at least 8 characters' },
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

                  if (isStrongPassword) {
                    return Promise.resolve()
                  }

                  return Promise.reject(new Error('Choose a stronger password.'))
                },
              },
            ]}
            extra={showPasswordHint
              ? 'Use at least 8 characters, including uppercase, lowercase, a number, and a symbol.'
              : undefined}
          >
            <Input.Password
              placeholder="Enter your new password"
              size="large"
              onBlur={() => {
                const value = newPasswordValue ?? ''
                const isStrongPassword =
                  value.length >= 8
                  && /[a-z]/.test(value)
                  && /[A-Z]/.test(value)
                  && /\d/.test(value)
                  && /[^A-Za-z0-9]/.test(value)

                setShowPasswordHint(Boolean(value) && !isStrongPassword)
              }}
              onChange={() => {
                if (showPasswordHint) {
                  setShowPasswordHint(false)
                }
              }}
            />
          </Form.Item>

          <Form.Item
            label="Confirm new password"
            name="confirmPassword"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: 'Please confirm the new password' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve()
                  }

                  return Promise.reject(new Error('The new passwords do not match'))
                },
              }),
            ]}
          >
            <Input.Password placeholder="Confirm your new password" size="large" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}

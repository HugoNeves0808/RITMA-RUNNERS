import { useEffect, useState } from 'react'
import { Alert, Button, Form, Input, Modal, message } from 'antd'
import { useTranslation } from 'react-i18next'
import { requestAccount } from '../services/authService'

type RequestAccountModalProps = {
  open: boolean
  onCancel: () => void
}

type RequestAccountFormValues = {
  email: string
}

export function RequestAccountModal({ open, onCancel }: RequestAccountModalProps) {
  const { t } = useTranslation()
  const pendingApprovalMessage = t('requestAccount.errors.pendingApproval')
  const [form] = Form.useForm<RequestAccountFormValues>()
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [messageApi, contextHolder] = message.useMessage()

  useEffect(() => {
    if (!open) {
      form.resetFields()
      setError(null)
      setIsSubmitting(false)
    }
  }, [form, open])

  const handleSubmit = async () => {
    setError(null)

    try {
      const values = await form.validateFields()
      setIsSubmitting(true)
      const response = await requestAccount(values)
      await messageApi.success(response.message)
      form.resetFields()
      onCancel()
    } catch (requestError) {
      if (
        typeof requestError === 'object'
        && requestError !== null
        && 'errorFields' in requestError
      ) {
        return
      }

      if (requestError instanceof Error) {
        if (requestError.message === pendingApprovalMessage) {
          await messageApi.warning(requestError.message)
          return
        }

        setError(requestError.message)
        return
      }

      setError(t('requestAccount.errors.generic'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {contextHolder}
      <Modal
        open={open}
        title={t('requestAccount.title')}
        onCancel={onCancel}
        footer={[
          <Button key="cancel" onClick={onCancel} disabled={isSubmitting}>
            {t('requestAccount.cancel')}
          </Button>,
          <Button key="submit" type="primary" loading={isSubmitting} onClick={handleSubmit}>
            {t('requestAccount.submit')}
          </Button>,
        ]}
        destroyOnHidden
      >
        {error ? (
          <Alert
            type="error"
            showIcon
            message={t('requestAccount.alertTitle')}
            description={error}
            style={{ marginBottom: 16 }}
          />
        ) : null}

        <Form<RequestAccountFormValues> form={form} layout="vertical" validateTrigger="onSubmit">
          <Form.Item
            label={t('requestAccount.emailLabel')}
            name="email"
            rules={[
              { required: true, message: t('requestAccount.emailRequired') },
              { type: 'email', message: t('requestAccount.emailInvalid') },
            ]}
          >
            <Input placeholder={t('requestAccount.placeholder')} size="large" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}

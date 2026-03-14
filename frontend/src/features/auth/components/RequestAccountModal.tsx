import { useEffect, useState } from 'react'
import { Alert, Button, Form, Input, Modal, message } from 'antd'
import { requestAccount } from '../services/authService'

type RequestAccountModalProps = {
  open: boolean
  onCancel: () => void
}

type RequestAccountFormValues = {
  email: string
}

export function RequestAccountModal({ open, onCancel }: RequestAccountModalProps) {
  const pendingApprovalMessage = 'This account is still pending administrator approval. Please wait.'
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

      setError('Unable to process the request right now. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {contextHolder}
      <Modal
        open={open}
        title="Request Account"
        onCancel={onCancel}
        footer={[
          <Button key="cancel" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>,
          <Button key="submit" type="primary" loading={isSubmitting} onClick={handleSubmit}>
            Submit
          </Button>,
        ]}
        destroyOnHidden
      >
        {error ? (
          <Alert
            type="error"
            showIcon
            message="Request failed"
            description={error}
            style={{ marginBottom: 16 }}
          />
        ) : null}

        <Form<RequestAccountFormValues> form={form} layout="vertical" validateTrigger="onSubmit">
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Email is required' },
              { type: 'email', message: 'Enter a valid email address' },
            ]}
          >
            <Input placeholder="name@domain.com" size="large" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}

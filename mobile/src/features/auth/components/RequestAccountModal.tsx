import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { useEffect, useMemo, useRef, useState } from 'react'
import { FontAwesome6 } from '@expo/vector-icons'
import { TextInputField } from '../../../components/TextInputField'
import { PrimaryButton } from '../../../components/PrimaryButton'
import { requestAccount } from '../services/authService'
import { colors } from '../../../theme/colors'

type RequestAccountModalProps = {
  visible: boolean
  onClose: () => void
}

export function RequestAccountModal({ visible, onClose }: RequestAccountModalProps) {
  const [email, setEmail] = useState('')
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [notice, setNotice] = useState<{ tone: 'success' | 'error'; message: string } | null>(null)
  const noticeProgress = useRef(new Animated.Value(1)).current

  const emailError = useMemo(() => {
    if (!fieldError) {
      return null
    }
    return fieldError
  }, [fieldError])

  useEffect(() => {
    if (!notice) {
      noticeProgress.setValue(1)
      return undefined
    }

    const animation = Animated.timing(noticeProgress, {
      toValue: 0,
      duration: 8000,
      useNativeDriver: false,
    })

    animation.start(({ finished }) => {
      if (finished) {
        setNotice(null)
      }
    })

    return () => animation.stop()
  }, [notice, noticeProgress])

  const handleClose = () => {
    setEmail('')
    setFieldError(null)
    setIsSubmitting(false)
    setNotice(null)
    onClose()
  }

  const handleSubmit = async () => {
    const normalizedEmail = email.trim().toLowerCase()

    if (!normalizedEmail) {
      setFieldError('Email is required.')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setFieldError('Enter a valid email address.')
      return
    }

    try {
      setFieldError(null)
      setIsSubmitting(true)
      const response = await requestAccount({ email: normalizedEmail })
      setNotice({ tone: 'success', message: response.message })
    } catch (requestError) {
      setNotice({
        tone: 'error',
        message: requestError instanceof Error ? requestError.message : 'Unable to submit request.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={handleClose}>
      <View style={styles.overlay}>
        {notice ? (
          <View style={styles.noticeWrapper} pointerEvents="box-none">
            <View
              style={[
                styles.notice,
                notice.tone === 'success' ? styles.noticeSuccess : styles.noticeError,
              ]}
            >
              <View style={styles.noticeContent}>
                <Text
                  style={[
                    styles.noticeText,
                    notice.tone === 'success' ? styles.noticeTextSuccess : styles.noticeTextError,
                  ]}
                >
                  {notice.message}
                </Text>
                <View style={styles.noticeTrack}>
                  <Animated.View
                    style={[
                      styles.noticeBar,
                      notice.tone === 'success' ? styles.noticeBarSuccess : styles.noticeBarError,
                      { width: noticeProgress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) },
                    ]}
                  />
                </View>
              </View>
              <Pressable hitSlop={8} onPress={() => setNotice(null)}>
                <FontAwesome6
                  name="xmark"
                  size={16}
                  color={notice.tone === 'success' ? colors.teal : colors.error}
                />
              </Pressable>
            </View>
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.title}>Request Account</Text>
          <Text style={styles.description}>
            Request access to RITMA and wait for approval before signing in.
          </Text>

          <TextInputField
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            error={emailError}
          />

          <View style={styles.actions}>
            <Pressable onPress={handleClose}>
              <Text style={styles.cancel}>Cancel</Text>
            </Pressable>
            <PrimaryButton
              label={isSubmitting ? 'Submitting...' : 'Submit'}
              onPress={handleSubmit}
              disabled={isSubmitting}
            />
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.38)',
    justifyContent: 'center',
    padding: 20,
  },
  noticeWrapper: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.cardBackground,
  },
  noticeSuccess: {
    borderColor: 'rgba(15, 118, 110, 0.24)',
  },
  noticeError: {
    borderColor: 'rgba(217, 45, 32, 0.24)',
  },
  noticeContent: {
    flex: 1,
    gap: 10,
  },
  noticeText: {
    fontSize: 14,
    lineHeight: 20,
  },
  noticeTextSuccess: {
    color: colors.teal,
  },
  noticeTextError: {
    color: colors.error,
  },
  noticeTrack: {
    height: 4,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: 'rgba(152, 162, 179, 0.18)',
  },
  noticeBar: {
    height: '100%',
    borderRadius: 999,
  },
  noticeBarSuccess: {
    backgroundColor: colors.teal,
  },
  noticeBarError: {
    backgroundColor: colors.error,
  },
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: 24,
    padding: 22,
    gap: 16,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
  },
  description: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  cancel: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
})

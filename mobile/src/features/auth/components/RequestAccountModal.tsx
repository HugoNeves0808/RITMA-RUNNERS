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
  onSuccessNotice?: (message: string) => void
}

export function RequestAccountModal({ visible, onClose, onSuccessNotice }: RequestAccountModalProps) {
  const [email, setEmail] = useState('')
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [notice, setNotice] = useState<{ tone: 'success' | 'warning' | 'error'; message: string } | null>(null)
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
      setFieldError('O email é obrigatório.')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setFieldError('Introduz um endereço de email válido.')
      return
    }

    try {
      setFieldError(null)
      setIsSubmitting(true)
      const response = await requestAccount({ email: normalizedEmail })
      setEmail('')
      setFieldError(null)
      onSuccessNotice?.(response.message)
      onClose()
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Não foi possível submeter o pedido.'
      setNotice({ tone: getNoticeTone(message), message })
    } finally {
      setIsSubmitting(false)
    }
  }

  const noticeAccentStyle =
    notice?.tone === 'success'
      ? styles.noticeAccentSuccess
      : notice?.tone === 'warning'
        ? styles.noticeAccentWarning
        : styles.noticeAccentError

  const noticeIconName =
    notice?.tone === 'success'
      ? 'circle-check'
      : notice?.tone === 'warning'
        ? 'triangle-exclamation'
        : 'circle-xmark'

  const noticeIconColor =
    notice?.tone === 'success'
      ? colors.teal
      : notice?.tone === 'warning'
        ? colors.warning
        : colors.error

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={handleClose}>
      <View style={styles.overlay}>
        {notice ? (
          <View style={styles.noticeWrapper} pointerEvents="box-none">
            <View
              style={[
                styles.notice,
              ]}
            >
              <View style={[styles.noticeAccent, noticeAccentStyle]} />
              <View style={styles.noticeContent}>
                <View style={styles.noticeHeader}>
                  <View style={styles.noticeIconWrap}>
                    <FontAwesome6 name={noticeIconName} size={18} color={noticeIconColor} />
                  </View>
                  <View style={styles.noticeCopy}>
                    <Text
                      style={[
                        styles.noticeLabel,
                        notice.tone === 'success'
                          ? styles.noticeTextSuccess
                          : notice.tone === 'warning'
                            ? styles.noticeTextWarning
                            : styles.noticeTextError,
                      ]}
                    >
                      {notice.tone === 'success'
                        ? 'Pedido submetido'
                        : notice.tone === 'warning'
                          ? 'Já pendente'
                          : 'Pedido falhou'}
                    </Text>
                    <Text style={styles.noticeText}>
                      {notice.message}
                    </Text>
                  </View>
                </View>
                <View style={styles.noticeTrack}>
                  <Animated.View
                    style={[
                      styles.noticeBar,
                      notice.tone === 'success'
                        ? styles.noticeBarSuccess
                        : notice.tone === 'warning'
                          ? styles.noticeBarWarning
                          : styles.noticeBarError,
                      { width: noticeProgress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) },
                    ]}
                  />
                </View>
              </View>
              <Pressable style={styles.noticeCloseButton} hitSlop={10} onPress={() => setNotice(null)}>
                <FontAwesome6
                  name="xmark"
                  size={18}
                  color={colors.textSecondary}
                />
              </Pressable>
            </View>
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.title}>Pedir conta</Text>
          <Text style={styles.description}>
            Pede acesso à RITMA e aguarda aprovação antes de entrares.
          </Text>

          <TextInputField
            label="Email"
            placeholder="Introduz o teu email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            error={emailError}
          />

          <View style={styles.actions}>
            <Pressable onPress={handleClose}>
              <Text style={styles.cancel}>Cancelar</Text>
            </Pressable>
            <PrimaryButton
              label={isSubmitting ? 'A submeter...' : 'Submeter'}
              onPress={handleSubmit}
              disabled={isSubmitting}
            />
          </View>
        </View>
      </View>
    </Modal>
  )
}

function getNoticeTone(message: string): 'success' | 'warning' | 'error' {
  const normalizedMessage = message.trim().toLowerCase()
  if (normalizedMessage.includes('pending') || normalizedMessage.includes('approval')) {
    return 'warning'
  }

  return 'error'
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
    gap: 10,
    borderRadius: 14,
    paddingRight: 12,
    backgroundColor: colors.cardBackground,
    shadowColor: '#101828',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    overflow: 'hidden',
  },
  noticeAccent: {
    width: 4,
    alignSelf: 'stretch',
  },
  noticeAccentSuccess: {
    backgroundColor: colors.teal,
  },
  noticeAccentError: {
    backgroundColor: colors.error,
  },
  noticeAccentWarning: {
    backgroundColor: colors.warning,
  },
  noticeContent: {
    flex: 1,
    gap: 8,
    paddingVertical: 11,
  },
  noticeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  noticeIconWrap: {
    paddingTop: 0,
    minWidth: 20,
    alignItems: 'center',
  },
  noticeCopy: {
    flex: 1,
    gap: 1,
  },
  noticeCloseButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  noticeLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  noticeText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  noticeTrack: {
    height: 3,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: 'rgba(16, 24, 40, 0.08)',
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
  noticeBarWarning: {
    backgroundColor: colors.warning,
  },
  noticeTextSuccess: {
    color: colors.teal,
  },
  noticeTextError: {
    color: colors.error,
  },
  noticeTextWarning: {
    color: colors.warning,
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

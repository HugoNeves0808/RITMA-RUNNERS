import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useEffect, useState } from 'react'
import { FontAwesome6 } from '@expo/vector-icons'
import { TextInputField } from '../../components/TextInputField'
import { PrimaryButton } from '../../components/PrimaryButton'
import { colors } from '../../theme/colors'
import { loginRequest } from '../../features/auth/services/authService'
import { RequestAccountModal } from '../../features/auth/components/RequestAccountModal'
import type { AuthSession } from '../../features/auth/types/auth'
import { isApiError } from '../../services/apiClient'

type LoginScreenProps = {
  onOpenFutureGoals: () => void
  onLoginSuccess: (session: AuthSession) => void
}

export function LoginScreen({ onOpenFutureGoals, onLoginSuccess }: LoginScreenProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberPassword, setRememberPassword] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRequestAccountOpen, setIsRequestAccountOpen] = useState(false)
  const [requestAccountNotice, setRequestAccountNotice] = useState<string | null>(null)

  useEffect(() => {
    if (!requestAccountNotice) {
      return undefined
    }

    const timeoutId = setTimeout(() => {
      setRequestAccountNotice(null)
    }, 8000)

    return () => clearTimeout(timeoutId)
  }, [requestAccountNotice])

  const handleLogin = async () => {
    const normalizedEmail = email.trim().toLowerCase()
    let hasError = false

    setEmailError(null)
    setPasswordError(null)
    setStatusMessage(null)

    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setEmailError('Enter a valid email address.')
      hasError = true
    }

    if (!password) {
      setPasswordError('Password is required.')
      hasError = true
    }

    if (hasError) {
      return
    }

    try {
      setIsSubmitting(true)
      const response = await loginRequest({
        email: normalizedEmail,
        password,
      })
      setStatusMessage(null)
      onLoginSuccess({
        token: response.token,
        user: response.user,
      })
    } catch (loginError) {
      const message =
        isApiError(loginError) && loginError.status === 401
          ? 'Invalid email or password.'
          : loginError instanceof Error
            ? loginError.message
            : 'Unable to sign in right now.'

      setStatusMessage(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <View style={styles.page}>
      {requestAccountNotice ? (
        <View style={styles.noticeWrapper} pointerEvents="box-none">
          <View style={styles.notice}>
            <View style={styles.noticeAccent} />
            <View style={styles.noticeContent}>
              <View style={styles.noticeHeader}>
                <FontAwesome6 name="circle-check" size={18} color={colors.teal} />
                <View style={styles.noticeCopy}>
                  <Text style={styles.noticeTitle}>Request submitted</Text>
                  <Text style={styles.noticeText}>{requestAccountNotice}</Text>
                </View>
              </View>
            </View>
            <Pressable style={styles.noticeCloseButton} hitSlop={10} onPress={() => setRequestAccountNotice(null)}>
              <FontAwesome6 name="xmark" size={18} color={colors.textSecondary} />
            </Pressable>
          </View>
        </View>
      ) : null}

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.logoRow}>
          <Image
            source={require('../../../assets/images/ritma-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <View style={styles.formCard}>
          <TextInputField
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            error={emailError}
          />
          <TextInputField
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            error={passwordError}
          />

          <View style={styles.metaRow}>
            <Pressable style={styles.rememberRow} onPress={() => setRememberPassword((current) => !current)}>
              <View style={[styles.checkbox, rememberPassword ? styles.checkboxChecked : null]}>
                {rememberPassword ? <View style={styles.checkboxInner} /> : null}
              </View>
              <Text style={styles.rememberText}>Remember password</Text>
            </Pressable>

            <Pressable hitSlop={8} onPress={() => setIsRequestAccountOpen(true)}>
              <Text style={styles.secondaryLink}>Request account</Text>
            </Pressable>
          </View>

          <PrimaryButton
            label={isSubmitting ? 'Signing in...' : 'Sign in'}
            onPress={handleLogin}
            disabled={isSubmitting}
            iconName="right-to-bracket"
          />

          {statusMessage ? <Text style={styles.statusMessage}>{statusMessage}</Text> : null}
        </View>

        <View style={styles.sidePanel}>
          <Pressable style={styles.developmentCard} onPress={onOpenFutureGoals}>
            <FontAwesome6 name="wrench" size={18} color={colors.purple} />
            <Text style={styles.developmentText}>
              RITMA is still in development.{' '}
              <Text style={styles.developmentLink}>See what is planned next.</Text>
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      <RequestAccountModal
        visible={isRequestAccountOpen}
        onClose={() => setIsRequestAccountOpen(false)}
        onSuccessNotice={setRequestAccountNotice}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.pageBackground,
  },
  noticeWrapper: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    zIndex: 20,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 32,
    gap: 32,
  },
  logoRow: {
    alignItems: 'center',
    marginTop: 34,
    marginBottom: 28,
  },
  logo: {
    width: 316,
    height: 108,
  },
  formCard: {
    paddingTop: 8,
    paddingBottom: 8,
    gap: 28,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderRadius: 14,
    backgroundColor: colors.cardBackground,
    overflow: 'hidden',
    shadowColor: '#101828',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  noticeAccent: {
    width: 4,
    alignSelf: 'stretch',
    backgroundColor: colors.teal,
  },
  noticeContent: {
    flex: 1,
    paddingVertical: 11,
  },
  noticeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  noticeCopy: {
    flex: 1,
    gap: 1,
  },
  noticeTitle: {
    color: colors.teal,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  noticeText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  noticeCloseButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    marginRight: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    marginTop: 4,
    marginBottom: 8,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: colors.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    borderColor: colors.primaryButton,
    backgroundColor: 'rgba(22, 119, 255, 0.12)',
  },
  checkboxInner: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.primaryButton,
  },
  rememberText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '500',
  },
  secondaryLink: {
    color: '#b54708',
    fontSize: 15,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  statusMessage: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  sidePanel: {
    marginTop: 'auto',
    paddingTop: 28,
  },
  developmentCard: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    backgroundColor: colors.cardBackground,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  developmentText: {
    color: colors.textSecondary,
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
  developmentLink: {
    color: '#b54708',
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
})

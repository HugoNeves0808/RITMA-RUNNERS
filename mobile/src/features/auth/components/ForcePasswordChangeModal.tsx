import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { useState } from 'react'
import { FontAwesome6 } from '@expo/vector-icons'
import { TextInputField } from '../../../components/TextInputField'
import { PrimaryButton } from '../../../components/PrimaryButton'
import { colors } from '../../../theme/colors'

type ForcePasswordChangeModalProps = {
  visible: boolean
  onSubmit: (payload: { currentPassword: string; newPassword: string }) => Promise<void>
  onLogout: () => void
}

export function ForcePasswordChangeModal({
  visible,
  onSubmit,
  onLogout,
}: ForcePasswordChangeModalProps) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [currentPasswordError, setCurrentPasswordError] = useState<string | null>(null)
  const [newPasswordError, setNewPasswordError] = useState<string | null>(null)
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const resetForm = () => {
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setError(null)
    setCurrentPasswordError(null)
    setNewPasswordError(null)
    setConfirmPasswordError(null)
    setIsSubmitting(false)
  }

  const handleSubmit = async () => {
    setError(null)
    setCurrentPasswordError(null)
    setNewPasswordError(null)
    setConfirmPasswordError(null)

    let hasError = false

    if (!currentPassword) {
      setCurrentPasswordError('Current password is required.')
      hasError = true
    }

    if (!newPassword) {
      setNewPasswordError('New password is required.')
      hasError = true
    } else if (!isStrongPassword(newPassword)) {
      setNewPasswordError('Use at least 8 characters, including uppercase, lowercase, a number, and a symbol.')
      hasError = true
    }

    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm the new password.')
      hasError = true
    } else if (confirmPassword !== newPassword) {
      setConfirmPasswordError('The new passwords do not match.')
      hasError = true
    }

    if (hasError) {
      return
    }

    try {
      setIsSubmitting(true)
      await onSubmit({ currentPassword, newPassword })
      resetForm()
    } catch (submitError) {
      if (submitError instanceof Error) {
        if (submitError.message === 'Current password is incorrect') {
          setError('Current password is incorrect.')
          return
        }

        if (
          submitError.message === 'Choose a stronger password.'
          || submitError.message === 'Use at least 8 characters, including uppercase, lowercase, a number, and a symbol.'
        ) {
          setError('Use at least 8 characters, including uppercase, lowercase, a number, and a symbol.')
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
    <Modal visible={visible} animationType="fade" transparent onRequestClose={() => undefined}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Change password</Text>
          <Text style={styles.description}>
            You must update your password before continuing in RITMA.
          </Text>

          {error ? <Text style={styles.errorBanner}>{error}</Text> : null}

          <TextInputField
            label="Current password"
            placeholder="Enter your current password"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
            autoCapitalize="none"
            error={currentPasswordError}
          />

          <TextInputField
            label="New password"
            placeholder="Enter your new password"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            autoCapitalize="none"
            error={newPasswordError}
          />

          <TextInputField
            label="Confirm new password"
            placeholder="Confirm your new password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoCapitalize="none"
            error={confirmPasswordError}
          />

          <View style={styles.actions}>
            <Pressable style={styles.logoutAction} onPress={onLogout}>
              <FontAwesome6 name="right-from-bracket" size={15} color={colors.warning} />
              <Text style={styles.logoutLink}>Sign out</Text>
            </Pressable>
            <PrimaryButton
              label={isSubmitting ? 'Updating...' : 'Update password'}
              onPress={handleSubmit}
              disabled={isSubmitting}
              iconName="key"
            />
          </View>
        </View>
      </View>
    </Modal>
  )
}

function isStrongPassword(password: string) {
  return password.length >= 8
    && /[a-z]/.test(password)
    && /[A-Z]/.test(password)
    && /\d/.test(password)
    && /[^A-Za-z0-9]/.test(password)
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.38)',
    justifyContent: 'center',
    padding: 20,
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
  errorBanner: {
    borderRadius: 14,
    backgroundColor: '#fff5f4',
    color: colors.error,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  logoutLink: {
    color: colors.warning,
    fontSize: 15,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  logoutAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
})

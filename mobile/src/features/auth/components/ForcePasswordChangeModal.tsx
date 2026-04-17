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
      setCurrentPasswordError('A palavra-passe atual é obrigatória.')
      hasError = true
    }

    if (!newPassword) {
      setNewPasswordError('A nova palavra-passe é obrigatória.')
      hasError = true
    } else if (!isStrongPassword(newPassword)) {
      setNewPasswordError('Usa pelo menos 8 caracteres, incluindo maiúsculas, minúsculas, um número e um símbolo.')
      hasError = true
    }

    if (!confirmPassword) {
      setConfirmPasswordError('Confirma a nova palavra-passe.')
      hasError = true
    } else if (confirmPassword !== newPassword) {
      setConfirmPasswordError('As novas palavras-passe não coincidem.')
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
          setError('A palavra-passe atual está incorreta.')
          return
        }

        if (
          submitError.message === 'Choose a stronger password.'
          || submitError.message === 'Use at least 8 characters, including uppercase, lowercase, a number, and a symbol.'
        ) {
          setError('Usa pelo menos 8 caracteres, incluindo maiúsculas, minúsculas, um número e um símbolo.')
          return
        }

        setError(submitError.message || 'Não foi possível alterar a palavra-passe agora. Tenta novamente.')
        return
      }

      setError('Não foi possível alterar a palavra-passe agora. Tenta novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={() => undefined}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Alterar palavra-passe</Text>
          <Text style={styles.description}>
            Tens de atualizar a tua palavra-passe antes de continuar na RITMA.
          </Text>

          {error ? <Text style={styles.errorBanner}>{error}</Text> : null}

          <TextInputField
            label="Palavra-passe atual"
            placeholder="Introduz a tua palavra-passe atual"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
            autoCapitalize="none"
            error={currentPasswordError}
          />

          <TextInputField
            label="Nova palavra-passe"
            placeholder="Introduz a tua nova palavra-passe"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            autoCapitalize="none"
            error={newPasswordError}
          />

          <TextInputField
            label="Confirmar nova palavra-passe"
            placeholder="Confirma a tua nova palavra-passe"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoCapitalize="none"
            error={confirmPasswordError}
          />

          <View style={styles.actions}>
            <Pressable style={styles.logoutAction} onPress={onLogout}>
              <FontAwesome6 name="right-from-bracket" size={15} color={colors.warning} />
              <Text style={styles.logoutLink}>Sair</Text>
            </Pressable>
            <PrimaryButton
              label={isSubmitting ? 'A atualizar...' : 'Atualizar palavra-passe'}
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

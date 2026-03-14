import { FontAwesome6 } from '@expo/vector-icons'
import { Pressable, StyleSheet, Text } from 'react-native'
import { colors } from '../theme/colors'

type PrimaryButtonProps = {
  label: string
  onPress: () => void
  disabled?: boolean
  iconName?: React.ComponentProps<typeof FontAwesome6>['name']
}

export function PrimaryButton({ label, onPress, disabled = false, iconName }: PrimaryButtonProps) {
  return (
    <Pressable
      style={[styles.button, disabled ? styles.buttonDisabled : null]}
      onPress={onPress}
      disabled={disabled}
    >
      {iconName ? <FontAwesome6 name={iconName} size={16} color={colors.primaryButtonText} /> : null}
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.primaryButton,
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  label: {
    color: colors.primaryButtonText,
    fontSize: 16,
    fontWeight: '700',
  },
})

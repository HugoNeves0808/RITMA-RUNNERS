import { useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { FontAwesome6 } from '@expo/vector-icons'
import { colors } from '../theme/colors'

type TextInputFieldProps = {
  label: string
  placeholder: string
  value: string
  onChangeText: (value: string) => void
  secureTextEntry?: boolean
  keyboardType?: 'default' | 'email-address'
  autoCapitalize?: 'none' | 'sentences'
  error?: string | null
}

export function TextInputField({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  error,
}: TextInputFieldProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const isSecureField = secureTextEntry

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrapper}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#98a2b3"
          secureTextEntry={isSecureField && !isPasswordVisible}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          style={[styles.input, isSecureField ? styles.inputWithAction : null, error ? styles.inputError : null]}
        />
        {isSecureField ? (
          <Pressable
            style={styles.visibilityToggle}
            hitSlop={10}
            onPress={() => setIsPasswordVisible((current) => !current)}
          >
            <FontAwesome6
              name={isPasswordVisible ? 'eye' : 'eye-slash'}
              size={16}
              color="#98a2b3"
            />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
  },
  label: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  inputWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 14,
    backgroundColor: 'transparent',
    color: colors.textPrimary,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inputWithAction: {
    paddingRight: 48,
  },
  inputError: {
    borderColor: colors.error,
  },
  visibilityToggle: {
    position: 'absolute',
    right: 14,
    height: 24,
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: {
    color: colors.error,
    fontSize: 13,
  },
})

import { useState } from 'react'
import { FontAwesome6 } from '@expo/vector-icons'
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { colors } from '../../../theme/colors'
import type { RacesCalendarMode } from '../types/racesCalendarMode'

type RacesCalendarModeSwitcherProps = {
  selectedMode: RacesCalendarMode
  onModeChange: (mode: RacesCalendarMode) => void
}

const OPTIONS: Array<{ value: RacesCalendarMode; label: string }> = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
]

export function RacesCalendarModeSwitcher({
  selectedMode,
  onModeChange,
}: RacesCalendarModeSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false)
  const activeOption = OPTIONS.find((option) => option.value === selectedMode)

  return (
    <>
      <Pressable
        style={styles.trigger}
        onPress={() => setIsOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="Open calendar mode options"
      >
        <Text style={styles.triggerLabel}>{activeOption?.label ?? 'Monthly'}</Text>
        <FontAwesome6 name="angle-down" size={16} color={colors.textSecondary} />
      </Pressable>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setIsOpen(false)}>
          <View style={styles.menu}>
            {OPTIONS.map((option) => {
              const isActive = option.value === selectedMode

              return (
                <Pressable
                  key={option.value}
                  style={[styles.option, isActive ? styles.optionActive : null]}
                  onPress={() => {
                    onModeChange(option.value)
                    setIsOpen(false)
                  }}
                >
                  <Text style={[styles.optionLabel, isActive ? styles.optionLabelActive : null]}>
                    {option.label}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        </Pressable>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  trigger: {
    minWidth: 126,
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 24, 40, 0.08)',
    backgroundColor: colors.cardBackground,
  },
  triggerLabel: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: 'rgba(16, 24, 40, 0.18)',
  },
  menu: {
    borderRadius: 18,
    backgroundColor: colors.cardBackground,
    padding: 10,
  },
  option: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 12,
  },
  optionActive: {
    backgroundColor: 'rgba(255, 244, 229, 0.95)',
  },
  optionLabel: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  optionLabelActive: {
    color: colors.warning,
  },
})

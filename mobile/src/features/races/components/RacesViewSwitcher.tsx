import { FontAwesome6 } from '@expo/vector-icons'
import { Pressable, StyleSheet, View } from 'react-native'
import { colors } from '../../../theme/colors'
import type { RacesViewMode } from '../types/racesViewMode'

type RacesViewSwitcherProps = {
  selectedView: RacesViewMode
  onViewChange: (view: RacesViewMode) => void
}

const VIEW_OPTIONS: Array<{
  value: RacesViewMode
  label: string
  icon: React.ComponentProps<typeof FontAwesome6>['name']
}> = [
  { value: 'calendar', label: 'Calendar view', icon: 'calendar-days' },
  { value: 'table', label: 'Table view', icon: 'table-cells-large' },
]

export function RacesViewSwitcher({ selectedView, onViewChange }: RacesViewSwitcherProps) {
  return (
    <View style={styles.switcher}>
      {VIEW_OPTIONS.map((option) => {
        const isActive = selectedView === option.value

        return (
          <Pressable
            key={option.value}
            style={[styles.switchButton, isActive ? styles.switchButtonActive : null]}
            onPress={() => onViewChange(option.value)}
            accessibilityRole="button"
            accessibilityLabel={option.label}
          >
            <FontAwesome6
              name={option.icon}
              size={18}
              color={isActive ? colors.primaryButtonText : colors.textSecondary}
            />
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  switcher: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    padding: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(16, 24, 40, 0.08)',
  },
  switchButton: {
    width: 48,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
  },
  switchButtonActive: {
    backgroundColor: colors.textPrimary,
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 3,
  },
})

import { StyleSheet, Text, View } from 'react-native'
import { colors } from '../../../theme/colors'

export function RacesCalendarView() {
  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>Calendar view</Text>
      <Text style={styles.title}>Race calendar placeholder</Text>
      <Text style={styles.description}>
        This area will host the calendar-based race exploration experience.
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    minHeight: 320,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 28,
    borderRadius: 28,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: 'rgba(16, 24, 40, 0.06)',
  },
  eyebrow: {
    color: colors.warning,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
  },
  description: {
    maxWidth: 280,
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
})

import { FontAwesome6 } from '@expo/vector-icons'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { colors } from '../../../theme/colors'
import type { RaceCalendarYearMonth } from '../types/racesCalendar'
import { RacesCalendarYearMonth as RacesCalendarYearMonthCard } from './RacesCalendarYearMonth'

type RacesCalendarYearlyViewProps = {
  year: number
  months: RaceCalendarYearMonth[]
  isLoading: boolean
  errorMessage: string | null
  onPreviousYear: () => void
  onNextYear: () => void
}

export function RacesCalendarYearlyView({
  year,
  months,
  isLoading,
  errorMessage,
  onPreviousYear,
  onNextYear,
}: RacesCalendarYearlyViewProps) {
  return (
    <View style={styles.card}>
      <View style={styles.toolbar}>
        <Pressable style={styles.iconButton} onPress={onPreviousYear}>
          <FontAwesome6 name="chevron-left" size={11} color={colors.primaryButtonText} />
        </Pressable>
        <Text style={styles.yearLabel}>{year}</Text>
        <Pressable style={styles.iconButton} onPress={onNextYear}>
          <FontAwesome6 name="chevron-right" size={11} color={colors.primaryButtonText} />
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.feedbackWrap}>
          <ActivityIndicator size="small" color={colors.warning} />
        </View>
      ) : null}

      {!isLoading && errorMessage ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>Unable to load races for this year.</Text>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}

      {!isLoading ? (
        <View style={styles.monthsGrid}>
          {months.map((month) => (
            <RacesCalendarYearMonthCard key={month.month} year={year} month={month.month} days={month.days} />
          ))}
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    backgroundColor: colors.cardBackground,
    padding: 14,
    shadowColor: '#101828',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 18 },
    shadowRadius: 30,
    elevation: 4,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 14,
  },
  iconButton: {
    width: 23,
    height: 23,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: colors.textPrimary,
  },
  yearLabel: {
    minWidth: 96,
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  feedbackWrap: {
    paddingVertical: 22,
    alignItems: 'center',
  },
  errorBox: {
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(217, 45, 32, 0.18)',
    borderRadius: 16,
    padding: 12,
    backgroundColor: 'rgba(254, 243, 242, 0.96)',
  },
  errorTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  errorText: {
    marginTop: 4,
    color: colors.error,
    fontSize: 13,
    lineHeight: 18,
  },
  monthsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
})

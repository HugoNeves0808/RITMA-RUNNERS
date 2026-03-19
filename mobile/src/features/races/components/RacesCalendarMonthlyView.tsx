import { FontAwesome6 } from '@expo/vector-icons'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { colors } from '../../../theme/colors'
import { RacesCalendarDayCell } from './RacesCalendarDayCell'
import type { RaceCalendarDay } from '../types/racesCalendar'

type RacesCalendarMonthlyViewProps = {
  year: number
  month: number
  days: RaceCalendarDay[]
  isLoading: boolean
  errorMessage: string | null
  onPreviousMonth: () => void
  onNextMonth: () => void
}

type CalendarCell = {
  key: string
  dayNumber: number
  isCurrentMonth: boolean
  isToday: boolean
  races: RaceCalendarDay['races']
}

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

function getMonthLabel(year: number, month: number) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month - 1, 1))
}

function toIsoDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function isToday(date: Date) {
  const now = new Date()
  return date.getFullYear() === now.getFullYear()
    && date.getMonth() === now.getMonth()
    && date.getDate() === now.getDate()
}

function buildCalendarCells(year: number, month: number, days: RaceCalendarDay[]): CalendarCell[] {
  const firstOfMonth = new Date(year, month - 1, 1)
  const firstWeekday = (firstOfMonth.getDay() + 6) % 7
  const firstVisibleDay = new Date(year, month - 1, 1 - firstWeekday)
  const racesByDate = new Map(days.map((day) => [day.date, day.races]))

  return Array.from({ length: 42 }, (_, index) => {
    const currentDate = new Date(firstVisibleDay)
    currentDate.setDate(firstVisibleDay.getDate() + index)
    const isoDate = toIsoDate(currentDate)

    return {
      key: isoDate,
      dayNumber: currentDate.getDate(),
      isCurrentMonth: currentDate.getMonth() === month - 1,
      isToday: isToday(currentDate),
      races: racesByDate.get(isoDate) ?? [],
    }
  })
}

export function RacesCalendarMonthlyView({
  year,
  month,
  days,
  isLoading,
  errorMessage,
  onPreviousMonth,
  onNextMonth,
}: RacesCalendarMonthlyViewProps) {
  const cells = buildCalendarCells(year, month, days)

  return (
    <View style={styles.card}>
      <View style={styles.toolbar}>
        <Pressable style={styles.iconButton} onPress={onPreviousMonth}>
          <FontAwesome6 name="chevron-left" size={11} color={colors.primaryButtonText} />
        </Pressable>
        <Text style={styles.monthLabel}>{getMonthLabel(year, month)}</Text>
        <Pressable style={styles.iconButton} onPress={onNextMonth}>
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
          <Text style={styles.errorTitle}>Unable to load races for this month.</Text>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}

      {!isLoading ? (
        <>
          <View style={styles.weekdays}>
            {WEEKDAYS.map((weekday, index) => (
              <Text key={`${weekday}-${index}`} style={styles.weekday}>{weekday}</Text>
            ))}
          </View>

          <View style={styles.grid}>
            {cells.map((cell) => (
              <RacesCalendarDayCell
                key={cell.key}
                dayNumber={cell.dayNumber}
                isCurrentMonth={cell.isCurrentMonth}
                isToday={cell.isToday}
                races={cell.races}
              />
            ))}
          </View>
        </>
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
  monthLabel: {
    minWidth: 146,
    color: colors.textPrimary,
    fontSize: 14,
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
  weekdays: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: '1%',
    marginBottom: 8,
  },
  weekday: {
    width: '13.4%',
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 6,
  },
})

import { StyleSheet, Text, View } from 'react-native'
import { colors } from '../../../theme/colors'
import type { RaceCalendarDay, RaceCalendarItem } from '../types/racesCalendar'

type RacesCalendarYearMonthProps = {
  year: number
  month: number
  days: RaceCalendarDay[]
}

type CalendarCell = {
  key: string
  dayNumber: number
  isCurrentMonth: boolean
  isToday: boolean
  races: RaceCalendarItem[]
}

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

const STATUS_PRIORITY: Record<string, number> = {
  CANCELLED: 0,
  DID_NOT_FINISH: 1,
  NOT_REGISTERED: 2,
  REGISTERED: 3,
  COMPLETED: 4,
  IN_LIST: 5,
  DID_NOT_START: 6,
}

const STATUS_BACKGROUND: Record<string, string> = {
  IN_LIST: '#64748b',
  REGISTERED: '#f97316',
  NOT_REGISTERED: '#ca8a04',
  COMPLETED: '#16a34a',
  CANCELLED: '#dc2626',
  DID_NOT_FINISH: '#ea580c',
  DID_NOT_START: '#9333ea',
}

function compareRaces(left: RaceCalendarItem, right: RaceCalendarItem) {
  if (left.raceTime && right.raceTime) {
    const timeComparison = left.raceTime.localeCompare(right.raceTime)
    if (timeComparison !== 0) {
      return timeComparison
    }
  }

  if (left.raceTime && !right.raceTime) {
    return -1
  }

  if (!left.raceTime && right.raceTime) {
    return 1
  }

  const statusComparison = (STATUS_PRIORITY[left.raceStatus] ?? Number.MAX_SAFE_INTEGER)
    - (STATUS_PRIORITY[right.raceStatus] ?? Number.MAX_SAFE_INTEGER)

  if (statusComparison !== 0) {
    return statusComparison
  }

  return left.name.localeCompare(right.name)
}

function getPrimaryRaceForDay(races: RaceCalendarItem[]) {
  if (races.length === 0) {
    return null
  }

  return [...races].sort(compareRaces)[0]
}

function getMonthLabel(year: number, month: number) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
  }).format(new Date(year, month - 1, 1))
}

function toIsoDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function buildCalendarCells(year: number, month: number, days: RaceCalendarDay[]): CalendarCell[] {
  const firstOfMonth = new Date(year, month - 1, 1)
  const firstWeekday = (firstOfMonth.getDay() + 6) % 7
  const firstVisibleDay = new Date(year, month - 1, 1 - firstWeekday)
  const racesByDate = new Map(days.map((day) => [day.date, day.races]))
  const todayIsoDate = toIsoDate(new Date())

  return Array.from({ length: 42 }, (_, index) => {
    const currentDate = new Date(firstVisibleDay)
    currentDate.setDate(firstVisibleDay.getDate() + index)
    const isoDate = toIsoDate(currentDate)

    return {
      key: isoDate,
      dayNumber: currentDate.getDate(),
      isCurrentMonth: currentDate.getMonth() === month - 1,
      isToday: isoDate === todayIsoDate,
      races: racesByDate.get(isoDate) ?? [],
    }
  })
}

export function RacesCalendarYearMonth({ year, month, days }: RacesCalendarYearMonthProps) {
  const cells = buildCalendarCells(year, month, days)
  const today = new Date()
  const isCurrentYearMonth = today.getFullYear() === year && today.getMonth() + 1 === month

  return (
    <View style={[styles.monthCard, isCurrentYearMonth ? styles.monthCardCurrent : null]}>
      <View style={styles.monthHeader}>
        <Text style={styles.monthLabel}>{getMonthLabel(year, month)}</Text>
      </View>

      <View style={styles.weekdays}>
        {WEEKDAYS.map((weekday, index) => (
          <Text key={`${weekday}-${month}-${index}`} style={styles.weekday}>{weekday}</Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((cell) => {
          const primaryRace = getPrimaryRaceForDay(cell.races)
          const badgeBackground = primaryRace ? (STATUS_BACKGROUND[primaryRace.raceStatus] ?? '#94a3b8') : 'transparent'

          return (
            <View key={cell.key} style={[styles.dayCell, !cell.isCurrentMonth ? styles.dayCellMuted : null]}>
              <View
                style={[
                  styles.dayBadge,
                  primaryRace ? styles.dayBadgeFilled : null,
                  primaryRace ? { backgroundColor: badgeBackground } : null,
                  cell.isToday ? styles.dayBadgeToday : null,
                ]}
              >
                <Text
                  style={[
                    styles.dayBadgeText,
                    primaryRace ? styles.dayBadgeTextFilled : null,
                    !cell.isCurrentMonth && !primaryRace ? styles.dayBadgeTextMuted : null,
                  ]}
                >
                  {cell.dayNumber}
                </Text>
              </View>
            </View>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  monthCard: {
    width: '100%',
    gap: 12,
    padding: 14,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderWidth: 1,
    borderColor: 'rgba(16, 24, 40, 0.08)',
  },
  monthCardCurrent: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    shadowColor: '#b54708',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  monthHeader: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthLabel: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  weekdays: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  weekday: {
    width: '13.4%',
    color: '#667085',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 8,
    marginTop: 2,
  },
  dayCell: {
    width: '13.4%',
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellMuted: {
    opacity: 0.42,
  },
  dayBadge: {
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayBadgeFilled: {
    backgroundColor: '#64748b',
  },
  dayBadgeToday: {
    borderWidth: 1,
    borderColor: 'rgba(181, 71, 8, 0.35)',
  },
  dayBadgeText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  dayBadgeTextFilled: {
    color: colors.primaryButtonText,
  },
  dayBadgeTextMuted: {
    color: '#98a2b3',
  },
})

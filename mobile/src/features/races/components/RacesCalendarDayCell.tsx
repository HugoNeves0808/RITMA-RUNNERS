import { FontAwesome6 } from '@expo/vector-icons'
import { StyleSheet, Text, View } from 'react-native'
import { colors } from '../../../theme/colors'
import type { RaceCalendarItem } from '../types/racesCalendar'

type RacesCalendarDayCellProps = {
  dayNumber: number
  isCurrentMonth: boolean
  isToday: boolean
  races: RaceCalendarItem[]
}

const STATUS_DOT: Record<string, string> = {
  IN_LIST: '#64748b',
  REGISTERED: '#f97316',
  NOT_REGISTERED: '#ca8a04',
  COMPLETED: '#16a34a',
  CANCELLED: '#dc2626',
  DID_NOT_FINISH: '#ea580c',
  DID_NOT_START: '#9333ea',
}

const STATUS_PRIORITY: Record<string, number> = {
  CANCELLED: 0,
  DID_NOT_FINISH: 1,
  NOT_REGISTERED: 2,
  REGISTERED: 3,
  COMPLETED: 4,
  IN_LIST: 5,
  DID_NOT_START: 6,
}

function compareRaces(left: RaceCalendarItem, right: RaceCalendarItem) {
  if (left.raceTime && right.raceTime) {
    return left.raceTime.localeCompare(right.raceTime)
  }

  if (left.raceTime) {
    return -1
  }

  if (right.raceTime) {
    return 1
  }

  const leftPriority = STATUS_PRIORITY[left.raceStatus] ?? Number.MAX_SAFE_INTEGER
  const rightPriority = STATUS_PRIORITY[right.raceStatus] ?? Number.MAX_SAFE_INTEGER

  if (leftPriority !== rightPriority) {
    return leftPriority - rightPriority
  }

  return left.name.localeCompare(right.name)
}

export function RacesCalendarDayCell({
  dayNumber,
  isCurrentMonth,
  isToday,
  races,
}: RacesCalendarDayCellProps) {
  const sortedRaces = [...races].sort(compareRaces)
  const primaryRace = sortedRaces[0]
  const raceCount = races.length
  const additionalRaceCount = Math.max(raceCount - 1, 0)

  return (
    <View
      style={[
        styles.cell,
        !isCurrentMonth ? styles.cellMuted : null,
        isToday ? styles.cellToday : null,
      ]}
    >
      <View style={styles.dateRow}>
        <Text style={[styles.dayNumber, !isCurrentMonth ? styles.dayNumberMuted : null]}>
          {dayNumber}
        </Text>
      </View>

      <View style={styles.raceList}>
        {primaryRace ? (
          <View style={styles.summaryWrap}>
            <View style={styles.countBadge}>
              <View style={[styles.iconWrap, { backgroundColor: STATUS_DOT[primaryRace.raceStatus] ?? '#94a3b8' }]}>
                <FontAwesome6 name="flag-checkered" size={13} color={colors.primaryButtonText} />
              </View>
            </View>

            <View style={styles.statusRow}>
              {additionalRaceCount > 0 ? <Text style={styles.countLabel}>+{additionalRaceCount}</Text> : null}
            </View>
          </View>
        ) : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  cell: {
    width: '13.4%',
    minHeight: 86,
    height: 86,
    gap: 2,
    padding: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(16, 24, 40, 0.08)',
    overflow: 'hidden',
  },
  cellMuted: {
    backgroundColor: 'rgba(248, 250, 252, 0.84)',
  },
  cellToday: {
    borderColor: 'rgba(181, 71, 8, 0.35)',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  dayNumber: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '800',
  },
  dayNumberMuted: {
    color: '#98a2b3',
  },
  raceList: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 0,
  },
  summaryWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  countBadge: {
    minWidth: 34,
    height: 34,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: '#ffffff',
  },
  iconWrap: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  countLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
  },
})

import styles from './RacesCalendarDayCell.module.css'
import type { RaceCalendarItem } from '../types/racesCalendar'
import { getPrimaryRaceForDay } from '../utils/racesCalendarRacePriority'

type RacesCalendarDayCellProps = {
  dayNumber: number
  isCurrentMonth: boolean
  isToday: boolean
  races: RaceCalendarItem[]
}

const RACE_STATUS_CLASS_MAP: Record<string, string> = {
  IN_LIST: 'raceItemInList',
  REGISTERED: 'raceItemRegistered',
  NOT_REGISTERED: 'raceItemNotRegistered',
  COMPLETED: 'raceItemCompleted',
  CANCELLED: 'raceItemCancelled',
  DID_NOT_FINISH: 'raceItemDidNotFinish',
  DID_NOT_START: 'raceItemDidNotStart',
}

const RACE_STATUS_DOT_CLASS_MAP: Record<string, string> = {
  IN_LIST: 'statusDotInList',
  REGISTERED: 'statusDotRegistered',
  NOT_REGISTERED: 'statusDotNotRegistered',
  COMPLETED: 'statusDotCompleted',
  CANCELLED: 'statusDotCancelled',
  DID_NOT_FINISH: 'statusDotDidNotFinish',
  DID_NOT_START: 'statusDotDidNotStart',
}

function formatRaceCategory(race: RaceCalendarItem) {
  if (race.raceTypeName) {
    return race.raceTypeName
  }

  return 'No race type'
}

function formatRaceStatus(race: RaceCalendarItem) {
  return race.raceStatus.replaceAll('_', ' ').toLowerCase()
}

export function RacesCalendarDayCell({
  dayNumber,
  isCurrentMonth,
  isToday,
  races,
}: RacesCalendarDayCellProps) {
  const primaryRace = getPrimaryRaceForDay(races)
  const visibleRaces = primaryRace ? [primaryRace] : []
  const remainingRaces = races.length - visibleRaces.length

  return (
    <div
      className={[
        styles.cell,
        !isCurrentMonth ? styles.cellMuted : '',
        isToday ? styles.cellToday : '',
      ].filter(Boolean).join(' ')}
    >
      <div className={styles.dateRow}>
        <span className={isCurrentMonth ? styles.dayNumber : `${styles.dayNumber} ${styles.dayNumberMuted}`}>
          {dayNumber}
        </span>
        {isToday ? <span className={styles.todayBadge}>Today</span> : null}
      </div>

      <div className={styles.raceList}>
        {visibleRaces.map((race) => (
          <div
            key={race.id}
            className={[
              styles.raceItem,
              styles[RACE_STATUS_CLASS_MAP[race.raceStatus] ?? ''],
            ].filter(Boolean).join(' ')}
          >
            <span className={styles.raceName}>{race.name}</span>
            <span className={styles.raceMeta}>{formatRaceCategory(race)}</span>
            <span className={styles.raceStatus}>
              <span
                className={[
                  styles.statusDot,
                  styles[RACE_STATUS_DOT_CLASS_MAP[race.raceStatus] ?? ''],
                ].filter(Boolean).join(' ')}
              />
              {formatRaceStatus(race)}
            </span>
          </div>
        ))}

        {remainingRaces > 0 ? <span className={styles.moreLabel}>+{remainingRaces} more</span> : null}
      </div>
    </div>
  )
}

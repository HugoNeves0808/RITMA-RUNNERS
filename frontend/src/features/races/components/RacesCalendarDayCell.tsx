import styles from './RacesCalendarDayCell.module.css'
import type { RaceCalendarItem } from '../types/racesCalendar'

type RacesCalendarDayCellProps = {
  dayNumber: number
  isCurrentMonth: boolean
  isToday: boolean
  races: RaceCalendarItem[]
}

function formatRaceCategory(race: RaceCalendarItem) {
  if (race.raceTypeName) {
    return race.raceTypeName
  }

  return 'No race type'
}

export function RacesCalendarDayCell({
  dayNumber,
  isCurrentMonth,
  isToday,
  races,
}: RacesCalendarDayCellProps) {
  const visibleRaces = races.slice(0, 1)
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
          <div key={race.id} className={styles.raceItem}>
            <span className={styles.raceName}>{race.name}</span>
            <span className={styles.raceMeta}>{formatRaceCategory(race)}</span>
          </div>
        ))}

        {remainingRaces > 0 ? <span className={styles.moreLabel}>+{remainingRaces} more</span> : null}
      </div>
    </div>
  )
}

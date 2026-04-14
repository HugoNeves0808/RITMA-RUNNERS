import styles from './RacesCalendarDayCell.module.css'
import type { RaceCalendarItem } from '../types/racesCalendar'
import { getPrimaryRaceForDay } from '../utils/racesCalendarRacePriority'
import { useTranslation } from 'react-i18next'
import { getRaceStatusLabel } from '../types/raceFilters'
import dayjs from 'dayjs'
import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

type RacesCalendarDayCellProps = {
  dayNumber: number
  isCurrentMonth: boolean
  isToday: boolean
  races: RaceCalendarItem[]
  onDayClick?: (races: RaceCalendarItem[]) => void
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

  return null
}

function isTerminalRaceStatus(status: string | null | undefined) {
  return status === 'COMPLETED'
    || status === 'DID_NOT_START'
    || status === 'DID_NOT_FINISH'
    || status === 'CANCELLED'
}

function shouldWarnAboutPastRaceStatus(race: RaceCalendarItem, now: dayjs.Dayjs) {
  if (!race.raceDate || isTerminalRaceStatus(race.raceStatus)) {
    return false
  }

  return now.startOf('day').isAfter(dayjs(race.raceDate).startOf('day'))
}

export function RacesCalendarDayCell({
  dayNumber,
  isCurrentMonth,
  isToday,
  races,
  onDayClick,
}: RacesCalendarDayCellProps) {
  const { t } = useTranslation()
  const now = dayjs()
  const primaryRace = getPrimaryRaceForDay(races)
  const visibleRaces = primaryRace ? [primaryRace] : []
  const remainingRaces = races.length - visibleRaces.length
  const isInteractive = races.length > 0 && onDayClick != null

  return (
    <div
      className={[
        styles.cell,
        !isCurrentMonth ? styles.cellMuted : '',
        isToday ? styles.cellToday : '',
        isInteractive ? styles.cellInteractive : '',
      ].filter(Boolean).join(' ')}
      onClick={isInteractive ? () => onDayClick(races) : undefined}
      onKeyDown={isInteractive ? (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onDayClick(races)
        }
      } : undefined}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
    >
      <div className={styles.dateRow}>
        <span className={isCurrentMonth ? styles.dayNumber : `${styles.dayNumber} ${styles.dayNumberMuted}`}>
          {dayNumber}
        </span>
        {isToday ? <span className={styles.todayBadge}>{t('races.calendar.today')}</span> : null}
      </div>

      <div className={styles.raceList}>
        {visibleRaces.map((race) => (
          (() => {
            const needsUpdate = shouldWarnAboutPastRaceStatus(race, now)

            return (
          <div
            key={race.id}
            className={[
              styles.raceItem,
              styles[RACE_STATUS_CLASS_MAP[race.raceStatus] ?? ''],
            ].filter(Boolean).join(' ')}
          >
            <span className={styles.raceName}>{race.name}</span>
            <span className={styles.raceMeta}>{formatRaceCategory(race) ?? t('races.calendar.noRaceType')}</span>
            <span className={styles.raceStatus}>
              <span
                className={[
                  styles.statusDot,
                  styles[RACE_STATUS_DOT_CLASS_MAP[race.raceStatus] ?? ''],
                ].filter(Boolean).join(' ')}
              />
              {needsUpdate ? (
                <span className={styles.updateIcon} aria-label={t('races.calendar.needsUpdate')} title={t('races.calendar.needsUpdate')}>
                  <FontAwesomeIcon icon={faTriangleExclamation} />
                </span>
              ) : null}
              {getRaceStatusLabel(race.raceStatus, t)}
            </span>
          </div>
            )
          })()
        ))}

        {remainingRaces > 0 ? (
          <span className={styles.moreLabel}>
            {remainingRaces === 1
              ? t('races.calendar.moreOne')
              : t('races.calendar.moreOther', { count: remainingRaces })}
          </span>
        ) : null}
      </div>
    </div>
  )
}

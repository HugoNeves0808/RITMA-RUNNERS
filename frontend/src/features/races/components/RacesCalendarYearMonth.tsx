import styles from './RacesCalendarYearMonth.module.css'
import type { RaceCalendarDay, RaceCalendarItem } from '../types/racesCalendar'
import { getPrimaryRaceForDay } from '../utils/racesCalendarRacePriority'

type RacesCalendarYearMonthProps = {
  year: number
  month: number
  days: RaceCalendarDay[]
  onDayClick?: (races: RaceCalendarItem[]) => void
}

type CalendarCell = {
  key: string
  dayNumber: number
  isCurrentMonth: boolean
  isToday: boolean
  races: RaceCalendarItem[]
}

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

const RACE_STATUS_CLASS_MAP: Record<string, string> = {
  IN_LIST: 'dayBadgeInList',
  REGISTERED: 'dayBadgeRegistered',
  NOT_REGISTERED: 'dayBadgeNotRegistered',
  COMPLETED: 'dayBadgeCompleted',
  CANCELLED: 'dayBadgeCancelled',
  DID_NOT_FINISH: 'dayBadgeDidNotFinish',
  DID_NOT_START: 'dayBadgeDidNotStart',
}

function getMonthLabel(year: number, month: number) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
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

function buildDayTitle(dayNumber: number, races: RaceCalendarItem[]) {
  if (races.length === 0) {
    return String(dayNumber)
  }

  const primaryRace = getPrimaryRaceForDay(races)
  const suffix = races.length === 1 ? 'race' : 'races'
  return `${dayNumber} - ${races.length} ${suffix}${primaryRace ? ` - ${primaryRace.name}` : ''}`
}

export function RacesCalendarYearMonth({ year, month, days, onDayClick }: RacesCalendarYearMonthProps) {
  const cells = buildCalendarCells(year, month, days)
  const today = new Date()
  const isCurrentYearMonth = today.getFullYear() === year && today.getMonth() + 1 === month

  return (
    <div className={[styles.monthCard, isCurrentYearMonth ? styles.monthCardCurrent : ''].filter(Boolean).join(' ')}>
      <div className={styles.monthHeader}>
        <span className={styles.monthLabel}>{getMonthLabel(year, month)}</span>
      </div>

      <div className={styles.weekdays}>
        {WEEKDAYS.map((weekday, index) => (
          <span key={`${weekday}-${month}-${index}`} className={styles.weekday}>{weekday}</span>
        ))}
      </div>

      <div className={styles.grid}>
        {cells.map((cell) => {
          const primaryRace = getPrimaryRaceForDay(cell.races)
          const dayBadgeClass = primaryRace
            ? styles[RACE_STATUS_CLASS_MAP[primaryRace.raceStatus] ?? '']
            : ''
          const isInteractive = cell.races.length > 0 && onDayClick != null

          return (
            <div
              key={cell.key}
              className={[
                styles.dayCell,
                !cell.isCurrentMonth ? styles.dayCellMuted : '',
                isInteractive ? styles.dayCellInteractive : '',
              ].filter(Boolean).join(' ')}
              title={buildDayTitle(cell.dayNumber, cell.races)}
              onClick={isInteractive ? () => onDayClick(cell.races) : undefined}
              onKeyDown={isInteractive ? (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  onDayClick(cell.races)
                }
              } : undefined}
              role={isInteractive ? 'button' : undefined}
              tabIndex={isInteractive ? 0 : undefined}
            >
              <span
                className={[
                  styles.dayBadge,
                  primaryRace ? styles.dayBadgeFilled : '',
                  dayBadgeClass,
                  cell.isToday ? styles.dayBadgeToday : '',
                  !cell.isCurrentMonth && !primaryRace ? styles.dayBadgeMuted : '',
                ].filter(Boolean).join(' ')}
              >
                {cell.dayNumber}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

import styles from './RacesCalendarYearMonth.module.css'
import type { RaceCalendarDay, RaceCalendarItem } from '../types/racesCalendar'
import { getPrimaryRaceForDay } from '../utils/racesCalendarRacePriority'
import { useTranslation } from 'react-i18next'

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

const RACE_STATUS_CLASS_MAP: Record<string, string> = {
  IN_LIST: 'dayBadgeInList',
  REGISTERED: 'dayBadgeRegistered',
  NOT_REGISTERED: 'dayBadgeNotRegistered',
  COMPLETED: 'dayBadgeCompleted',
  CANCELLED: 'dayBadgeCancelled',
  DID_NOT_FINISH: 'dayBadgeDidNotFinish',
  DID_NOT_START: 'dayBadgeDidNotStart',
}

function getMonthLabel(year: number, month: number, locale: string) {
  const label = new Intl.DateTimeFormat(locale, { month: 'long' }).format(new Date(year, month - 1, 1))
  return label.length === 0 ? label : `${label.charAt(0).toUpperCase()}${label.slice(1)}`
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

function buildDayTitle(
  dayNumber: number,
  races: RaceCalendarItem[],
  t: (key: string, options?: Record<string, unknown>) => string,
) {
  if (races.length === 0) {
    return String(dayNumber)
  }

  const primaryRace = getPrimaryRaceForDay(races)
  const base = races.length === 1
    ? t('races.calendar.yearMonth.titleOne', { day: dayNumber })
    : t('races.calendar.yearMonth.titleOther', { day: dayNumber, count: races.length })

  return primaryRace ? `${base} - ${primaryRace.name}` : base
}

export function RacesCalendarYearMonth({ year, month, days, onDayClick }: RacesCalendarYearMonthProps) {
  const { t, i18n } = useTranslation()
  const locale = i18n.resolvedLanguage === 'pt' ? 'pt-PT' : 'en-GB'
  const cells = buildCalendarCells(year, month, days)
  const today = new Date()
  const isCurrentYearMonth = today.getFullYear() === year && today.getMonth() + 1 === month

  return (
    <div className={[styles.monthCard, isCurrentYearMonth ? styles.monthCardCurrent : ''].filter(Boolean).join(' ')}>
      <div className={styles.monthHeader}>
        <span className={styles.monthLabel}>{getMonthLabel(year, month, locale)}</span>
      </div>

      <div className={styles.weekdays}>
        <span className={styles.weekday}>{t('races.calendar.weekdaysNarrow.mon')}</span>
        <span className={styles.weekday}>{t('races.calendar.weekdaysNarrow.tue')}</span>
        <span className={styles.weekday}>{t('races.calendar.weekdaysNarrow.wed')}</span>
        <span className={styles.weekday}>{t('races.calendar.weekdaysNarrow.thu')}</span>
        <span className={styles.weekday}>{t('races.calendar.weekdaysNarrow.fri')}</span>
        <span className={styles.weekday}>{t('races.calendar.weekdaysNarrow.sat')}</span>
        <span className={styles.weekday}>{t('races.calendar.weekdaysNarrow.sun')}</span>
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
              title={buildDayTitle(cell.dayNumber, cell.races, t)}
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

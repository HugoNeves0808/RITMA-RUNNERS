import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'
import type { TrainingCalendarDay, TrainingCalendarItem } from '../types/trainingsCalendar'
import styles from './TrainingsCalendarYearMonth.module.css'

type TrainingsCalendarYearMonthProps = {
  year: number
  month: number
  days: TrainingCalendarDay[]
  onDayClick?: (items: TrainingCalendarItem[]) => void
}

type CalendarCell = {
  key: string
  dayNumber: number
  isCurrentMonth: boolean
  isToday: boolean
  items: TrainingCalendarItem[]
}

function getPrimaryItemForDay(items: TrainingCalendarItem[]) {
  const sortedItems = [...items].sort((left, right) => {
    if (left.kind !== right.kind) {
      return left.kind === 'race' ? -1 : 1
    }

    const leftTime = left.time ?? '99:99:99'
    const rightTime = right.time ?? '99:99:99'
    const timeComparison = leftTime.localeCompare(rightTime)
    if (timeComparison !== 0) {
      return timeComparison
    }

    if (left.kind === 'training' && right.kind === 'training' && left.time == null && right.time == null) {
      const createdAtComparison = dayjs(right.createdAt).valueOf() - dayjs(left.createdAt).valueOf()
      if (createdAtComparison !== 0) {
        return createdAtComparison
      }
    }

    return left.name.localeCompare(right.name)
  })

  return sortedItems[0] ?? null
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

function buildCalendarCells(year: number, month: number, days: TrainingCalendarDay[]): CalendarCell[] {
  const firstOfMonth = new Date(year, month - 1, 1)
  const firstWeekday = (firstOfMonth.getDay() + 6) % 7
  const firstVisibleDay = new Date(year, month - 1, 1 - firstWeekday)
  const itemsByDate = new Map(days.map((day) => [day.date, day.items]))
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
      items: itemsByDate.get(isoDate) ?? [],
    }
  })
}

function buildDayTitle(
  dayNumber: number,
  items: TrainingCalendarItem[],
  t: (key: string, options?: Record<string, unknown>) => string,
) {
  if (items.length === 0) {
    return String(dayNumber)
  }

  const primaryItem = getPrimaryItemForDay(items)
  const base = items.length === 1
    ? t('trainings.calendar.yearMonth.titleOne', { day: dayNumber })
    : t('trainings.calendar.yearMonth.titleOther', { day: dayNumber, count: items.length })

  return primaryItem ? `${base} - ${primaryItem.name}` : base
}

export function TrainingsCalendarYearMonth({ year, month, days, onDayClick }: TrainingsCalendarYearMonthProps) {
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
          const primaryItem = getPrimaryItemForDay(cell.items)
          const isInteractive = cell.items.length > 0 && onDayClick != null

          return (
            <div
              key={cell.key}
              className={[
                styles.dayCell,
                !cell.isCurrentMonth ? styles.dayCellMuted : '',
                isInteractive ? styles.dayCellInteractive : '',
              ].filter(Boolean).join(' ')}
              title={buildDayTitle(cell.dayNumber, cell.items, t)}
              onClick={isInteractive ? () => onDayClick(cell.items) : undefined}
              onKeyDown={isInteractive ? (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  onDayClick(cell.items)
                }
              } : undefined}
              role={isInteractive ? 'button' : undefined}
              tabIndex={isInteractive ? 0 : undefined}
            >
              {primaryItem?.kind === 'race' ? (
                <span className={styles.dayFlagWrap}>
                  <span className={styles.dayFlag} />
                </span>
              ) : (
                <span
                  className={[
                    styles.dayBadge,
                    primaryItem ? styles.dayBadgeFilled : '',
                    primaryItem?.kind === 'training'
                      ? (
                        primaryItem.status === 'REALIZADO'
                          ? styles.dayBadgeTrainingDone
                          : styles.dayBadgeTrainingPlanned
                      )
                      : '',
                    cell.isToday ? styles.dayBadgeToday : '',
                    !cell.isCurrentMonth ? styles.dayBadgeMuted : '',
                  ].filter(Boolean).join(' ')}
                >
                  {cell.dayNumber}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

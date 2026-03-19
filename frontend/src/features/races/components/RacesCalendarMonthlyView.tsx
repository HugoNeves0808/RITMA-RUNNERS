import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Alert, Card, Spin } from 'antd'
import { RacesCalendarDayCell } from './RacesCalendarDayCell'
import styles from './RacesCalendarMonthlyView.module.css'
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
  isoDate: string
  isCurrentMonth: boolean
  isToday: boolean
  races: RaceCalendarDay['races']
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

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
      isoDate,
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
    <Card className={styles.calendarCard} variant="borderless">
      <div className={styles.toolbar}>
        <div className={styles.controls}>
          <button type="button" className={styles.iconButton} onClick={onPreviousMonth} aria-label="Open previous month">
            <FontAwesomeIcon icon={faChevronLeft} />
          </button>
          <span className={styles.monthLabel}>{getMonthLabel(year, month)}</span>
          <button type="button" className={styles.iconButton} onClick={onNextMonth} aria-label="Open next month">
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className={styles.loadingWrap}>
          <Spin size="large" />
        </div>
      ) : null}

      {!isLoading && errorMessage ? (
        <div className={styles.feedbackWrap}>
          <Alert type="error" message="Unable to load races for this month." description={errorMessage} showIcon />
        </div>
      ) : null}

      {!isLoading ? (
        <>
          <div className={styles.weekdays}>
            {WEEKDAYS.map((weekday) => (
              <span key={weekday} className={styles.weekday}>{weekday}</span>
            ))}
          </div>

          <div className={styles.grid}>
            {cells.map((cell) => (
              <RacesCalendarDayCell
                key={cell.key}
                dayNumber={cell.dayNumber}
                isCurrentMonth={cell.isCurrentMonth}
                isToday={cell.isToday}
                races={cell.races}
              />
            ))}
          </div>
        </>
      ) : null}
    </Card>
  )
}

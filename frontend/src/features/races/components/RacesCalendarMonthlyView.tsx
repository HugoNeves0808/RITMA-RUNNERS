import { useEffect, useRef, useState } from 'react'
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Alert, Card, Empty, Spin } from 'antd'
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
  onMonthSelect: (year: number, month: number) => void
  onDayClick: (races: RaceCalendarDay['races']) => void
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
  onMonthSelect,
  onDayClick,
}: RacesCalendarMonthlyViewProps) {
  const cells = buildCalendarCells(year, month, days)
  const hasRaces = days.some((day) => day.races.length > 0)
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false)
  const pickerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!isMonthPickerOpen) {
      return
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (pickerRef.current?.contains(event.target as Node)) {
        return
      }

      setIsMonthPickerOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [isMonthPickerOpen])

  return (
    <Card className={styles.calendarCard} variant="borderless">
      <div className={styles.toolbar}>
        <div className={styles.controls}>
          <button type="button" className={styles.iconButton} onClick={onPreviousMonth} aria-label="Open previous month">
            <FontAwesomeIcon icon={faChevronLeft} />
          </button>
          <div className={styles.monthPickerWrap} ref={pickerRef}>
            <button
              type="button"
              className={styles.monthLabelButton}
              onClick={() => setIsMonthPickerOpen((current) => !current)}
              aria-label="Choose calendar month"
              aria-expanded={isMonthPickerOpen}
            >
              <span className={styles.monthLabel}>{getMonthLabel(year, month)}</span>
            </button>

            {isMonthPickerOpen ? (
              <div className={styles.monthPickerPopover}>
                <label className={styles.monthPickerLabel}>
                  <span className={styles.monthPickerText}>Jump to month</span>
                  <input
                    type="month"
                    className={styles.monthPickerInput}
                    value={`${year}-${String(month).padStart(2, '0')}`}
                    onChange={(event) => {
                      const [nextYearText, nextMonthText] = event.target.value.split('-')
                      const nextYear = Number(nextYearText)
                      const nextMonth = Number(nextMonthText)

                      if (!Number.isInteger(nextYear) || !Number.isInteger(nextMonth)) {
                        return
                      }

                      onMonthSelect(nextYear, nextMonth)
                      setIsMonthPickerOpen(false)
                    }}
                  />
                </label>
              </div>
            ) : null}
          </div>
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

      {!isLoading && !errorMessage && !hasRaces ? (
        <div className={styles.emptyWrap}>
          <Empty description="No races match the current filters." />
        </div>
      ) : null}

      {!isLoading && (errorMessage || hasRaces) ? (
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
                onDayClick={onDayClick}
              />
            ))}
          </div>
        </>
      ) : null}
    </Card>
  )
}

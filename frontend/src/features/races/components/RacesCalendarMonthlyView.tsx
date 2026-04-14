import { useEffect, useRef, useState } from 'react'
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import dayjs from 'dayjs'
import { Alert, Card, DatePicker, Spin } from 'antd'
import { useTranslation } from 'react-i18next'
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

function capitalizeFirst(value: string) {
  return value.length === 0 ? value : `${value.charAt(0).toUpperCase()}${value.slice(1)}`
}

function getMonthLabel(year: number, month: number, locale: string) {
  const date = new Date(year, month - 1, 1)
  const monthLabel = new Intl.DateTimeFormat(locale, { month: 'long' }).format(date)
  const yearLabel = new Intl.DateTimeFormat(locale, { year: 'numeric' }).format(date)
  return `${capitalizeFirst(monthLabel)} ${yearLabel}`
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
  const { t, i18n } = useTranslation()
  const locale = i18n.resolvedLanguage === 'pt' ? 'pt-PT' : 'en-GB'
  const cells = buildCalendarCells(year, month, days)
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
          <button type="button" className={styles.iconButton} onClick={onPreviousMonth} aria-label={t('races.calendar.monthly.previousMonthAria')}>
            <FontAwesomeIcon icon={faChevronLeft} />
          </button>
          <div className={styles.monthPickerWrap} ref={pickerRef}>
            <button
              type="button"
              className={styles.monthLabelButton}
              onClick={() => setIsMonthPickerOpen((current) => !current)}
              aria-label={t('races.calendar.monthly.chooseMonthAria')}
              aria-expanded={isMonthPickerOpen}
            >
              <span className={styles.monthLabel}>{getMonthLabel(year, month, locale)}</span>
            </button>

            {isMonthPickerOpen ? (
              <div className={styles.monthPickerPopover}>
                <label className={styles.monthPickerLabel}>
                  <span className={styles.monthPickerText}>{t('races.calendar.monthly.jumpToMonth')}</span>
                  <DatePicker
                    picker="month"
                    className={styles.monthPickerInput}
                    value={dayjs(new Date(year, month - 1, 1))}
                    allowClear={false}
                    inputReadOnly
                    getPopupContainer={() => pickerRef.current ?? document.body}
                    onChange={(value) => {
                      if (!value) {
                        return
                      }

                      onMonthSelect(value.year(), value.month() + 1)
                      setIsMonthPickerOpen(false)
                    }}
                  />
                </label>
              </div>
            ) : null}
          </div>
          <button type="button" className={styles.iconButton} onClick={onNextMonth} aria-label={t('races.calendar.monthly.nextMonthAria')}>
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
          <Alert type="error" message={t('races.calendar.monthly.loadErrorTitle')} description={errorMessage} showIcon />
        </div>
      ) : null}

      {/* Keep calendar visible even when there are no races. */}

      {!isLoading && !errorMessage ? (
        <>
          <div className={styles.weekdays}>
            <span className={styles.weekday}>{t('races.calendar.weekdays.mon')}</span>
            <span className={styles.weekday}>{t('races.calendar.weekdays.tue')}</span>
            <span className={styles.weekday}>{t('races.calendar.weekdays.wed')}</span>
            <span className={styles.weekday}>{t('races.calendar.weekdays.thu')}</span>
            <span className={styles.weekday}>{t('races.calendar.weekdays.fri')}</span>
            <span className={styles.weekday}>{t('races.calendar.weekdays.sat')}</span>
            <span className={styles.weekday}>{t('races.calendar.weekdays.sun')}</span>
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

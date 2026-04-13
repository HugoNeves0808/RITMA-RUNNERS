import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Alert, Card, Empty, Spin } from 'antd'
import type { RaceCalendarYearMonth } from '../types/racesCalendar'
import { RacesCalendarYearMonth } from './RacesCalendarYearMonth'
import styles from './RacesCalendarYearlyView.module.css'

type RacesCalendarYearlyViewProps = {
  year: number
  months: RaceCalendarYearMonth[]
  isLoading: boolean
  errorMessage: string | null
  onPreviousYear: () => void
  onNextYear: () => void
  onDayClick: (races: RaceCalendarYearMonth['days'][number]['races']) => void
}

export function RacesCalendarYearlyView({
  year,
  months,
  isLoading,
  errorMessage,
  onPreviousYear,
  onNextYear,
  onDayClick,
}: RacesCalendarYearlyViewProps) {
  const hasRaces = months.some((month) => month.days.some((day) => day.races.length > 0))

  return (
    <Card className={styles.calendarCard} variant="borderless">
      <div className={styles.toolbar}>
        <div className={styles.controls}>
          <button type="button" className={styles.iconButton} onClick={onPreviousYear} aria-label="Open previous year">
            <FontAwesomeIcon icon={faChevronLeft} />
          </button>
          <span className={styles.yearLabel}>{year}</span>
          <button type="button" className={styles.iconButton} onClick={onNextYear} aria-label="Open next year">
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
          <Alert type="error" message="Unable to load races for this year." description={errorMessage} showIcon />
        </div>
      ) : null}

      {!isLoading && !errorMessage && !hasRaces ? (
        <div className={styles.emptyWrap}>
          <Empty description="No races match the current filters." />
        </div>
      ) : null}

      {!isLoading && (errorMessage || hasRaces) ? (
        <div className={styles.monthsGrid}>
          {months.map((month) => (
            <RacesCalendarYearMonth
              key={month.month}
              year={year}
              month={month.month}
              days={month.days}
              onDayClick={onDayClick}
            />
          ))}
        </div>
      ) : null}
    </Card>
  )
}

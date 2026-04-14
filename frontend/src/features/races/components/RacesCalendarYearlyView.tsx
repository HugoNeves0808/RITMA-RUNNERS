import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Alert, Card, Spin } from 'antd'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()

  return (
    <Card className={styles.calendarCard} variant="borderless">
      <div className={styles.toolbar}>
        <div className={styles.controls}>
          <button type="button" className={styles.iconButton} onClick={onPreviousYear} aria-label={t('races.calendar.yearly.previousYearAria')}>
            <FontAwesomeIcon icon={faChevronLeft} />
          </button>
          <span className={styles.yearLabel}>{year}</span>
          <button type="button" className={styles.iconButton} onClick={onNextYear} aria-label={t('races.calendar.yearly.nextYearAria')}>
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
          <Alert type="error" message={t('races.calendar.yearly.loadErrorTitle')} description={errorMessage} showIcon />
        </div>
      ) : null}

      {/* Keep calendar visible even when there are no races. */}

      {!isLoading && !errorMessage ? (
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

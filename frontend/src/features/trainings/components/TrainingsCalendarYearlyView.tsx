import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Alert, Card, Spin } from 'antd'
import { useTranslation } from 'react-i18next'
import type { TrainingCalendarItem, TrainingCalendarYearMonth } from '../types/trainingsCalendar'
import { TrainingsCalendarYearMonth } from './TrainingsCalendarYearMonth'
import styles from '../../races/components/RacesCalendarYearlyView.module.css'

type TrainingsCalendarYearlyViewProps = {
  year: number
  months: TrainingCalendarYearMonth[]
  isLoading: boolean
  errorMessage: string | null
  onPreviousYear: () => void
  onNextYear: () => void
  onDayClick: (items: TrainingCalendarItem[]) => void
}

export function TrainingsCalendarYearlyView({
  year,
  months,
  isLoading,
  errorMessage,
  onPreviousYear,
  onNextYear,
  onDayClick,
}: TrainingsCalendarYearlyViewProps) {
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
          <Alert type="error" message={t('trainings.calendar.yearly.loadErrorTitle')} description={errorMessage} showIcon />
        </div>
      ) : null}

      {!isLoading && !errorMessage ? (
        <div className={styles.monthsGrid}>
          {months.map((month) => (
            <TrainingsCalendarYearMonth
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

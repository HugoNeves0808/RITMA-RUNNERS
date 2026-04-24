import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'
import type { TrainingCalendarItem } from '../types/trainingsCalendar'
import { getRaceStatusLabel } from '../../races'
import styles from './TrainingsCalendarDayCell.module.css'

type TrainingsCalendarDayCellProps = {
  dayNumber: number
  isCurrentMonth: boolean
  isToday: boolean
  items: TrainingCalendarItem[]
  onDayClick?: (items: TrainingCalendarItem[]) => void
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

function getTrainingStatusLabel(status: TrainingCalendarItem['status'], t: (key: string, options?: Record<string, unknown>) => string) {
  if (status === 'REALIZADO') {
    return t('trainings.status.done')
  }

  return t('trainings.status.planned')
}

function getItemStatusLabel(item: TrainingCalendarItem, t: (key: string, options?: Record<string, unknown>) => string) {
  return item.kind === 'race'
    ? getRaceStatusLabel(item.status, t)
    : getTrainingStatusLabel(item.status, t)
}

function getCardClassName(item: TrainingCalendarItem) {
  if (item.kind === 'race') {
    switch (item.status) {
      case 'IN_LIST':
        return styles.itemCardRaceInList
      case 'REGISTERED':
        return styles.itemCardRaceRegistered
      case 'NOT_REGISTERED':
        return styles.itemCardRaceNotRegistered
      case 'COMPLETED':
        return styles.itemCardRaceCompleted
      case 'CANCELLED':
        return styles.itemCardRaceCancelled
      case 'DID_NOT_FINISH':
        return styles.itemCardRaceDidNotFinish
      case 'DID_NOT_START':
        return styles.itemCardRaceDidNotStart
      default:
        return ''
    }
  }

  switch (item.status) {
    case 'REALIZADO':
      return styles.itemCardTrainingDone
    default:
      return styles.itemCardTrainingPlanned
  }
}

function getStatusDotClassName(item: TrainingCalendarItem) {
  if (item.kind === 'race') {
    switch (item.status) {
      case 'IN_LIST':
        return styles.statusDotRaceInList
      case 'REGISTERED':
        return styles.statusDotRaceRegistered
      case 'NOT_REGISTERED':
        return styles.statusDotRaceNotRegistered
      case 'COMPLETED':
        return styles.statusDotRaceCompleted
      case 'CANCELLED':
        return styles.statusDotRaceCancelled
      case 'DID_NOT_FINISH':
        return styles.statusDotRaceDidNotFinish
      case 'DID_NOT_START':
        return styles.statusDotRaceDidNotStart
      default:
        return ''
    }
  }

  switch (item.status) {
    case 'REALIZADO':
      return styles.statusDotTrainingDone
    default:
      return styles.statusDotTrainingPlanned
  }
}

function getDayNumberClassName(isCurrentMonth: boolean) {
  return [
    styles.dayNumber,
    !isCurrentMonth ? styles.dayNumberMuted : '',
  ].filter(Boolean).join(' ')
}

export function TrainingsCalendarDayCell({
  dayNumber,
  isCurrentMonth,
  isToday,
  items,
  onDayClick,
}: TrainingsCalendarDayCellProps) {
  const { t } = useTranslation()
  const primaryItem = getPrimaryItemForDay(items)
  const visibleItems = primaryItem ? [primaryItem] : []
  const remainingItems = items.length - visibleItems.length
  const isInteractive = items.length > 0 && onDayClick != null

  return (
    <div
      className={[
        styles.cell,
        !isCurrentMonth ? styles.cellMuted : '',
        isToday ? styles.cellToday : '',
        primaryItem?.kind === 'race' ? styles.cellRace : '',
        isInteractive ? styles.cellInteractive : '',
      ].filter(Boolean).join(' ')}
      onClick={isInteractive ? () => onDayClick(items) : undefined}
      onKeyDown={isInteractive ? (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onDayClick(items)
        }
      } : undefined}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
    >
      <div className={styles.dateRow}>
        <span className={getDayNumberClassName(isCurrentMonth)}>
          {dayNumber}
        </span>
        {isToday ? <span className={styles.todayBadge}>{t('races.calendar.today')}</span> : null}
      </div>

      <div className={styles.itemList}>
        {visibleItems.map((item) => (
          <div
            key={`${item.kind}-${item.id}`}
            className={[styles.itemCard, getCardClassName(item)].filter(Boolean).join(' ')}
          >
            <span className={styles.itemName}>{item.name}</span>
            <span className={styles.itemMeta}>{item.subtitle ?? (item.kind === 'race' ? t('races.calendar.noRaceType') : t('trainings.details.values.none'))}</span>
            <span className={styles.itemStatus}>
              <span className={[styles.statusDot, getStatusDotClassName(item)].filter(Boolean).join(' ')} />
              {getItemStatusLabel(item, t)}
            </span>
          </div>
        ))}

        {remainingItems > 0 ? (
          <span className={styles.moreLabel}>
            {remainingItems === 1
              ? t('races.calendar.moreOne')
              : t('races.calendar.moreOther', { count: remainingItems })}
          </span>
        ) : null}
      </div>
    </div>
  )
}

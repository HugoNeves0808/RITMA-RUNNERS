import { useEffect, useMemo, useRef, useState } from 'react'
import { Drawer, Tooltip } from 'antd'
import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'
import { useAuth } from '../../auth'
import { EMPTY_RACE_FILTERS, fetchRaceDetail, RaceDetailsDrawer, getRaceStatusLabel } from '../../races'
import { fetchRaceCalendarMonth, fetchRaceCalendarYear } from '../../races/services/racesCalendarService'
import type { RaceCalendarMonthPayload, RaceCalendarYearPayload } from '../../races'
import type { TrainingFilters, TrainingTableItem } from '../types/trainings'
import type { TrainingCalendarDay, TrainingCalendarItem, TrainingCalendarYearMonth } from '../types/trainingsCalendar'
import { TrainingDetailsDrawer } from './TrainingDetailsDrawer'
import { TrainingsCalendarMonthlyView } from './TrainingsCalendarMonthlyView'
import { TrainingsCalendarYearlyView } from './TrainingsCalendarYearlyView'
import styles from './TrainingsCalendarView.module.css'

type TrainingsCalendarMode = 'monthly' | 'yearly'
type TrainingsCalendarViewMode = 'table' | 'calendar'

type TrainingsCalendarViewProps = {
  selectedMode: TrainingsCalendarMode
  trainings: TrainingTableItem[]
  filters: TrainingFilters
  onEditTraining?: (training: TrainingTableItem) => void
  onDeleteTraining?: (training: TrainingTableItem) => void
}

function toIsoDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDayDrawerDate(value: string, locale: string) {
  const date = new Date(`${value}T00:00:00`)
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function formatDisplayTime(value: string | null | undefined) {
  if (!value) {
    return '-'
  }

  const parts = value.split(':')
  if (parts.length >= 2) {
    return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`
  }

  return value
}

function getTrainingStatusLabel(status: TrainingTableItem['trainingStatus'], t: (key: string, options?: Record<string, unknown>) => string) {
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

function getItemStatusClassName(item: TrainingCalendarItem) {
  if (item.kind === 'race') {
    switch (item.status) {
      case 'REGISTERED':
        return styles.statusRaceRegistered
      case 'COMPLETED':
        return styles.statusRaceCompleted
      case 'IN_LIST':
        return styles.statusRaceInList
      case 'NOT_REGISTERED':
        return styles.statusRaceNotRegistered
      case 'CANCELLED':
        return styles.statusRaceCancelled
      case 'DID_NOT_START':
        return styles.statusRaceDns
      case 'DID_NOT_FINISH':
        return styles.statusRaceDnf
      default:
        return styles.statusUnknown
    }
  }

  if (item.status === 'REALIZADO') {
    return styles.statusTrainingDone
  }

  return styles.statusTrainingPlanned
}

function sortCalendarItems(items: TrainingCalendarItem[]) {
  return [...items].sort((left, right) => {
    const leftTime = left.time ?? '99:99:99'
    const rightTime = right.time ?? '99:99:99'

    if (leftTime !== rightTime) {
      return leftTime.localeCompare(rightTime)
    }

    if (left.kind !== right.kind) {
      return left.kind === 'race' ? -1 : 1
    }

    if (left.kind === 'training' && right.kind === 'training' && left.time == null && right.time == null) {
      const createdAtComparison = dayjs(right.createdAt).valueOf() - dayjs(left.createdAt).valueOf()
      if (createdAtComparison !== 0) {
        return createdAtComparison
      }
    }

    return left.name.localeCompare(right.name)
  })
}

function filterRaceMonthPayload(payload: RaceCalendarMonthPayload, search: string) {
  const normalizedSearch = search.trim().toLowerCase()
  if (!normalizedSearch) {
    return payload
  }

  return {
    ...payload,
    days: payload.days
      .map((day) => ({
        ...day,
        races: day.races.filter((race) => race.name.toLowerCase().includes(normalizedSearch)),
      }))
      .filter((day) => day.races.length > 0),
  }
}

function filterRaceYearPayload(payload: RaceCalendarYearPayload, search: string) {
  const normalizedSearch = search.trim().toLowerCase()
  if (!normalizedSearch) {
    return payload
  }

  return {
    ...payload,
    months: payload.months.map((month) => ({
      ...month,
      days: month.days
        .map((day) => ({
          ...day,
          races: day.races.filter((race) => race.name.toLowerCase().includes(normalizedSearch)),
        }))
        .filter((day) => day.races.length > 0),
    })),
  }
}

function filterTrainingsBySearch(trainings: TrainingTableItem[], search: string) {
  const normalizedSearch = search.trim().toLowerCase()
  if (!normalizedSearch) {
    return trainings
  }

  return trainings.filter((training) => training.name.toLowerCase().includes(normalizedSearch))
}

function buildMonthlyTrainingDays(trainings: TrainingTableItem[], year: number, month: number): TrainingCalendarDay[] {
  const firstOfMonth = dayjs(new Date(year, month - 1, 1))
  const firstWeekday = (firstOfMonth.day() + 6) % 7
  const firstVisibleDay = firstOfMonth.subtract(firstWeekday, 'day')
  const lastVisibleDay = firstVisibleDay.add(41, 'day')
  const itemsByDate = new Map<string, TrainingCalendarItem[]>()

  trainings.forEach((training) => {
    const trainingDate = dayjs(training.trainingDate)
    if (trainingDate.isBefore(firstVisibleDay, 'day') || trainingDate.isAfter(lastVisibleDay, 'day')) {
      return
    }

    const current = itemsByDate.get(training.trainingDate) ?? []
    current.push({
      kind: 'training',
      id: training.id,
      name: training.name,
      date: training.trainingDate,
      time: training.trainingTime,
      createdAt: training.createdAt,
      subtitle: training.trainingTypeName,
      status: training.trainingStatus,
    })
    itemsByDate.set(training.trainingDate, current)
  })

  return [...itemsByDate.entries()]
    .map(([date, items]) => ({
      date,
      items: sortCalendarItems(items),
    }))
    .sort((left, right) => left.date.localeCompare(right.date))
}

function buildYearlyTrainingMonths(trainings: TrainingTableItem[], year: number): TrainingCalendarYearMonth[] {
  const monthsByNumber = new Map<number, Map<string, TrainingCalendarItem[]>>()

  trainings.forEach((training) => {
    const trainingDate = dayjs(training.trainingDate)
    if (trainingDate.year() !== year) {
      return
    }

    const month = trainingDate.month() + 1
    const monthMap = monthsByNumber.get(month) ?? new Map<string, TrainingCalendarItem[]>()
    const current = monthMap.get(training.trainingDate) ?? []
    current.push({
      kind: 'training',
      id: training.id,
      name: training.name,
      date: training.trainingDate,
      time: training.trainingTime,
      createdAt: training.createdAt,
      subtitle: training.trainingTypeName,
      status: training.trainingStatus,
    })
    monthMap.set(training.trainingDate, current)
    monthsByNumber.set(month, monthMap)
  })

  return Array.from({ length: 12 }, (_, index) => {
    const month = index + 1
    const monthMap = monthsByNumber.get(month) ?? new Map<string, TrainingCalendarItem[]>()

    return {
      month,
      days: [...monthMap.entries()]
        .map(([date, items]) => ({
          date,
          items: sortCalendarItems(items),
        }))
        .sort((left, right) => left.date.localeCompare(right.date)),
    }
  })
}

function mergeMonthlyDays(trainingDays: TrainingCalendarDay[], racePayload: RaceCalendarMonthPayload | null): TrainingCalendarDay[] {
  const itemsByDate = new Map<string, TrainingCalendarItem[]>()

  trainingDays.forEach((day) => {
    itemsByDate.set(day.date, [...day.items])
  })

  racePayload?.days.forEach((day) => {
    const current = itemsByDate.get(day.date) ?? []
    current.push(...day.races.map((race) => ({
      kind: 'race' as const,
      id: race.id,
      name: race.name,
      date: race.raceDate,
      time: race.raceTime,
      subtitle: race.raceTypeName,
      status: race.raceStatus,
    })))
    itemsByDate.set(day.date, current)
  })

  return [...itemsByDate.entries()]
    .map(([date, items]) => ({
      date,
      items: sortCalendarItems(items),
    }))
    .sort((left, right) => left.date.localeCompare(right.date))
}

function mergeYearlyMonths(trainingMonths: TrainingCalendarYearMonth[], racePayload: RaceCalendarYearPayload | null): TrainingCalendarYearMonth[] {
  return Array.from({ length: 12 }, (_, index) => {
    const month = index + 1
    const trainingMonth = trainingMonths.find((entry) => entry.month === month)
    const raceMonth = racePayload?.months.find((entry) => entry.month === month)
    const itemsByDate = new Map<string, TrainingCalendarItem[]>()

    trainingMonth?.days.forEach((day) => {
      itemsByDate.set(day.date, [...day.items])
    })

    raceMonth?.days.forEach((day) => {
      const current = itemsByDate.get(day.date) ?? []
      current.push(...day.races.map((race) => ({
        kind: 'race' as const,
        id: race.id,
        name: race.name,
        date: race.raceDate,
        time: race.raceTime,
        subtitle: race.raceTypeName,
        status: race.raceStatus,
      })))
      itemsByDate.set(day.date, current)
    })

    return {
      month,
      days: [...itemsByDate.entries()]
        .map(([date, items]) => ({
          date,
          items: sortCalendarItems(items),
        }))
        .sort((left, right) => left.date.localeCompare(right.date)),
    }
  })
}

export function TrainingsCalendarView({
  selectedMode,
  trainings,
  filters,
  onEditTraining,
  onDeleteTraining,
}: TrainingsCalendarViewProps) {
  const { t, i18n } = useTranslation()
  const locale = i18n.resolvedLanguage === 'pt' ? 'pt-PT' : 'en-GB'
  const { token } = useAuth()
  const raceDetailsCacheRef = useRef<Map<string, Awaited<ReturnType<typeof fetchRaceDetail>>>>(new Map())
  const [visibleYear, setVisibleYear] = useState(() => new Date().getFullYear())
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const today = new Date()
    return { year: today.getFullYear(), month: today.getMonth() + 1 }
  })
  const [rawMonthlyRaces, setRawMonthlyRaces] = useState<RaceCalendarMonthPayload | null>(null)
  const [rawYearlyRaces, setRawYearlyRaces] = useState<RaceCalendarYearPayload | null>(null)
  const [isMonthlyLoading, setIsMonthlyLoading] = useState(true)
  const [isYearlyLoading, setIsYearlyLoading] = useState(false)
  const [monthlyErrorMessage, setMonthlyErrorMessage] = useState<string | null>(null)
  const [yearlyErrorMessage, setYearlyErrorMessage] = useState<string | null>(null)
  const [selectedDay, setSelectedDay] = useState<{ date: string; items: TrainingCalendarItem[] } | null>(null)
  const [isDayDrawerOpen, setIsDayDrawerOpen] = useState(false)
  const [selectedTraining, setSelectedTraining] = useState<TrainingTableItem | null>(null)
  const [raceDetails, setRaceDetails] = useState<Awaited<ReturnType<typeof fetchRaceDetail>> | null>(null)
  const [isRaceDetailsOpen, setIsRaceDetailsOpen] = useState(false)
  const [isRaceDetailsLoading, setIsRaceDetailsLoading] = useState(false)
  const [raceDetailsError, setRaceDetailsError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setRawMonthlyRaces(null)
      setIsMonthlyLoading(false)
      return
    }

    if (selectedMode !== 'monthly') {
      return
    }

    const loadMonthlyRaces = async () => {
      try {
        setIsMonthlyLoading(true)
        const response = await fetchRaceCalendarMonth(visibleMonth.year, visibleMonth.month, token, EMPTY_RACE_FILTERS)
        setRawMonthlyRaces(response)
        setMonthlyErrorMessage(null)
      } catch (error) {
        setRawMonthlyRaces(null)
        setMonthlyErrorMessage(error instanceof Error ? error.message : t('trainings.calendar.monthly.loadErrorFallback'))
      } finally {
        setIsMonthlyLoading(false)
      }
    }

    void loadMonthlyRaces()
  }, [selectedMode, t, token, visibleMonth.month, visibleMonth.year])

  useEffect(() => {
    if (!token) {
      setRawYearlyRaces(null)
      setIsYearlyLoading(false)
      return
    }

    if (selectedMode !== 'yearly') {
      return
    }

    const loadYearlyRaces = async () => {
      try {
        setIsYearlyLoading(true)
        const response = await fetchRaceCalendarYear(visibleYear, token, EMPTY_RACE_FILTERS)
        setRawYearlyRaces(response)
        setYearlyErrorMessage(null)
      } catch (error) {
        setRawYearlyRaces(null)
        setYearlyErrorMessage(error instanceof Error ? error.message : t('trainings.calendar.yearly.loadErrorFallback'))
      } finally {
        setIsYearlyLoading(false)
      }
    }

    void loadYearlyRaces()
  }, [selectedMode, t, token, visibleYear])

  const filteredMonthlyRaces = useMemo(
    () => (rawMonthlyRaces ? filterRaceMonthPayload(rawMonthlyRaces, filters.search) : null),
    [filters.search, rawMonthlyRaces],
  )

  const filteredYearlyRaces = useMemo(
    () => (rawYearlyRaces ? filterRaceYearPayload(rawYearlyRaces, filters.search) : null),
    [filters.search, rawYearlyRaces],
  )
  const filteredTrainings = useMemo(
    () => filterTrainingsBySearch(trainings, filters.search),
    [filters.search, trainings],
  )

  const monthlyDays = useMemo(() => (
    mergeMonthlyDays(
      buildMonthlyTrainingDays(filteredTrainings, visibleMonth.year, visibleMonth.month),
      filteredMonthlyRaces,
    )
  ), [filteredMonthlyRaces, filteredTrainings, visibleMonth.month, visibleMonth.year])

  const yearlyMonths = useMemo(() => (
    mergeYearlyMonths(
      buildYearlyTrainingMonths(filteredTrainings, visibleYear),
      filteredYearlyRaces,
    )
  ), [filteredTrainings, filteredYearlyRaces, visibleYear])

  const trainingsById = useMemo(
    () => new Map(trainings.map((training) => [training.id, training])),
    [trainings],
  )

  useEffect(() => {
    if (!selectedDay) {
      return
    }

    const nextItems = selectedDay.items.filter((item) => (
      item.kind === 'race' || trainingsById.has(item.id)
    ))

    if (nextItems.length === selectedDay.items.length) {
      return
    }

    if (nextItems.length === 0) {
      setSelectedDay(null)
      setIsDayDrawerOpen(false)
      return
    }

    setSelectedDay({
      date: selectedDay.date,
      items: sortCalendarItems(nextItems),
    })
  }, [selectedDay, trainingsById])

  useEffect(() => {
    if (!selectedTraining) {
      return
    }

    if (trainingsById.has(selectedTraining.id)) {
      return
    }

    setSelectedTraining(null)
  }, [selectedTraining, trainingsById])

  const moveMonth = (direction: -1 | 1) => {
    setVisibleMonth((currentValue) => {
      const nextDate = new Date(currentValue.year, currentValue.month - 1 + direction, 1)
      return {
        year: nextDate.getFullYear(),
        month: nextDate.getMonth() + 1,
      }
    })
  }

  const moveYear = (direction: -1 | 1) => {
    setVisibleYear((currentValue) => currentValue + direction)
  }

  const openRaceDetails = async (raceId: string) => {
    if (!token) {
      return
    }

    try {
      const cachedDetails = raceDetailsCacheRef.current.get(raceId)
      setIsDayDrawerOpen(false)
      setIsRaceDetailsOpen(true)
      setIsRaceDetailsLoading(!cachedDetails)
      setRaceDetailsError(null)
      setRaceDetails(cachedDetails ?? null)

      if (cachedDetails) {
        return
      }

      const details = await fetchRaceDetail(raceId, token)
      raceDetailsCacheRef.current.set(raceId, details)
      setRaceDetails(details)
    } catch (loadError) {
      setRaceDetails(null)
      setRaceDetailsError(loadError instanceof Error ? loadError.message : t('races.calendar.loadRaceErrorFallback'))
    } finally {
      setIsRaceDetailsLoading(false)
    }
  }

  const openTrainingDetails = (trainingId: string) => {
    const training = trainingsById.get(trainingId)
    if (!training) {
      return
    }

    setIsDayDrawerOpen(false)
    setSelectedTraining(training)
  }

  const openDay = (items: TrainingCalendarItem[]) => {
    if (items.length === 0) {
      return
    }

    const sortedItems = sortCalendarItems(items)
    if (sortedItems.length === 1) {
      handleOpenItem(sortedItems[0])
      return
    }

    const date = sortedItems[0]?.date ?? toIsoDate(new Date())
    setSelectedDay({ date, items: sortedItems })
    setIsDayDrawerOpen(true)
  }

  const handleOpenItem = (item: TrainingCalendarItem) => {
    if (item.kind === 'race') {
      void openRaceDetails(item.id)
      return
    }

    openTrainingDetails(item.id)
  }

  return (
    <>
      {selectedMode === 'monthly' ? (
        <TrainingsCalendarMonthlyView
          year={visibleMonth.year}
          month={visibleMonth.month}
          days={monthlyDays}
          isLoading={isMonthlyLoading}
          errorMessage={monthlyErrorMessage}
          onPreviousMonth={() => moveMonth(-1)}
          onNextMonth={() => moveMonth(1)}
          onMonthSelect={(year, month) => setVisibleMonth({ year, month })}
          onDayClick={openDay}
        />
      ) : (
        <TrainingsCalendarYearlyView
          year={visibleYear}
          months={yearlyMonths}
          isLoading={isYearlyLoading}
          errorMessage={yearlyErrorMessage}
          onPreviousYear={() => moveYear(-1)}
          onNextYear={() => moveYear(1)}
          onDayClick={openDay}
        />
      )}

      <Drawer
        open={isDayDrawerOpen}
        placement="right"
        width={420}
        onClose={() => setIsDayDrawerOpen(false)}
        className={styles.dayDrawer}
        title={selectedDay ? (
          <div className={styles.dayDrawerTitle}>
            <span className={styles.dayDrawerEyebrow}>{t('trainings.calendar.dayTitle')}</span>
            <span className={styles.dayDrawerDate}>{formatDayDrawerDate(selectedDay.date, locale)}</span>
          </div>
        ) : t('trainings.calendar.dayTitle')}
      >
        {selectedDay ? (
          <div className={styles.dayItemList}>
            {selectedDay.items.map((item) => (
              <button
                key={`${item.kind}-${item.id}`}
                type="button"
                className={styles.dayItemButton}
                onClick={() => handleOpenItem(item)}
              >
                <div className={styles.dayItemHeader}>
                  <Tooltip title={item.name}>
                    <span className={styles.dayItemName}>{item.name}</span>
                  </Tooltip>
                  <span className={`${styles.dayItemStatus} ${getItemStatusClassName(item)}`.trim()}>
                    {getItemStatusLabel(item, t)}
                  </span>
                </div>

                <div className={styles.dayItemMeta}>
                  <div className={styles.dayItemMetaItem}>
                    <span className={styles.dayItemMetaLabel}>{t('trainings.calendar.meta.time')}</span>
                    <span className={styles.dayItemMetaValue}>{formatDisplayTime(item.time)}</span>
                  </div>
                  <div className={styles.dayItemMetaItem}>
                    <span className={styles.dayItemMetaLabel}>
                      {item.kind === 'race' ? t('trainings.calendar.meta.raceType') : t('trainings.calendar.meta.trainingType')}
                    </span>
                    <span className={styles.dayItemMetaValue}>{item.subtitle ?? t('trainings.details.values.none')}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : null}
      </Drawer>

      <TrainingDetailsDrawer
        open={selectedTraining != null}
        training={selectedTraining}
        locale={locale}
        onEdit={selectedTraining ? () => {
          onEditTraining?.(selectedTraining)
          setSelectedTraining(null)
        } : undefined}
        onDelete={selectedTraining ? () => {
          onDeleteTraining?.(selectedTraining)
        } : undefined}
        onClose={() => setSelectedTraining(null)}
      />

      <RaceDetailsDrawer
        open={isRaceDetailsOpen}
        race={raceDetails}
        isLoading={isRaceDetailsLoading}
        error={raceDetailsError}
        onClose={() => {
          setIsRaceDetailsOpen(false)
          setRaceDetails(null)
          setRaceDetailsError(null)
          if (selectedDay && selectedDay.items.length > 1) {
            setIsDayDrawerOpen(true)
          }
        }}
      />
    </>
  )
}

export type { TrainingsCalendarMode, TrainingsCalendarViewMode }

import { useEffect, useState } from 'react'
import { Drawer, Tooltip } from 'antd'
import { useAuth } from '../../auth'
import { fetchRaceCalendarMonth, fetchRaceCalendarYear } from '../services/racesCalendarService'
import { fetchRaceDetail } from '../services/racesTableService'
import type { RaceFilters } from '../types/raceFilters'
import type { RaceCalendarItem, RaceCalendarMonthPayload, RaceCalendarYearPayload } from '../types/racesCalendar'
import type { RaceDetailResponse } from '../types/racesTable'
import type { RacesCalendarMode } from '../types/racesCalendarMode'
import { RaceDetailsDrawer } from './RaceDetailsDrawer'
import { RacesCalendarMonthlyView } from './RacesCalendarMonthlyView'
import { RacesCalendarYearlyView } from './RacesCalendarYearlyView'
import styles from './RacesCalendarView.module.css'

type RacesCalendarViewProps = {
  selectedMode: RacesCalendarMode
  onModeChange: (mode: RacesCalendarMode) => void
  filters: RaceFilters
  refreshKey?: number
}

function formatDayDrawerDate(value: string) {
  const date = new Date(`${value}T00:00:00`)
  return new Intl.DateTimeFormat('en-US', {
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

  const [hoursText = '0', minutesText = '0'] = value.split(':')
  const hours = Number(hoursText)
  const minutes = Number(minutesText)

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return value
  }

  const suffix = hours >= 12 ? 'PM' : 'AM'
  const normalizedHours = hours % 12 || 12
  return `${String(normalizedHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${suffix}`
}

function formatStatusLabel(status: string | null | undefined) {
  if (!status) {
    return 'Unknown'
  }

  switch (status) {
    case 'REGISTERED':
      return 'Registered'
    case 'COMPLETED':
      return 'Completed'
    case 'IN_LIST':
      return 'In list'
    case 'NOT_REGISTERED':
      return 'Not registered'
    case 'CANCELLED':
      return 'Cancelled'
    case 'DID_NOT_START':
      return 'Did not start'
    case 'DID_NOT_FINISH':
      return 'Did not finish'
    default:
      return status.replaceAll('_', ' ').toLowerCase()
  }
}

function getStatusClassName(status: string | null | undefined) {
  switch (status) {
    case 'REGISTERED':
      return styles.statusRegistered
    case 'COMPLETED':
      return styles.statusCompleted
    case 'IN_LIST':
      return styles.statusInList
    case 'NOT_REGISTERED':
      return styles.statusNotRegistered
    case 'CANCELLED':
      return styles.statusCancelled
    case 'DID_NOT_START':
      return styles.statusDns
    case 'DID_NOT_FINISH':
      return styles.statusDnf
    default:
      return styles.statusUnknown
  }
}

function filterCalendarMonthPayload(payload: RaceCalendarMonthPayload, search: string) {
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

function filterCalendarYearPayload(payload: RaceCalendarYearPayload, search: string) {
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

export function RacesCalendarView({ selectedMode, filters, refreshKey = 0 }: RacesCalendarViewProps) {
  const { token } = useAuth()
  const [visibleYear, setVisibleYear] = useState(() => new Date().getFullYear())
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const today = new Date()
    return { year: today.getFullYear(), month: today.getMonth() + 1 }
  })
  const [calendarData, setCalendarData] = useState<RaceCalendarMonthPayload | null>(null)
  const [yearCalendarData, setYearCalendarData] = useState<RaceCalendarYearPayload | null>(null)
  const [isMonthlyLoading, setIsMonthlyLoading] = useState(true)
  const [isYearlyLoading, setIsYearlyLoading] = useState(false)
  const [monthlyErrorMessage, setMonthlyErrorMessage] = useState<string | null>(null)
  const [yearlyErrorMessage, setYearlyErrorMessage] = useState<string | null>(null)
  const [selectedDay, setSelectedDay] = useState<{ date: string; races: RaceCalendarItem[] } | null>(null)
  const [isDayDrawerOpen, setIsDayDrawerOpen] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isDetailsLoading, setIsDetailsLoading] = useState(false)
  const [detailsError, setDetailsError] = useState<string | null>(null)
  const [raceDetails, setRaceDetails] = useState<RaceDetailResponse | null>(null)

  useEffect(() => {
    if (!token || selectedMode !== 'monthly') {
      return
    }

    const loadMonthlyCalendar = async () => {
      try {
        setIsMonthlyLoading(true)
        const response = await fetchRaceCalendarMonth(visibleMonth.year, visibleMonth.month, token, filters)
        setCalendarData(filterCalendarMonthPayload(response, filters.search))
        setMonthlyErrorMessage(null)
      } catch (error) {
        setMonthlyErrorMessage(
          error instanceof Error
            ? 'Calendar data is temporarily unavailable.'
            : 'Calendar data is temporarily unavailable.',
        )
      } finally {
        setIsMonthlyLoading(false)
      }
    }

    void loadMonthlyCalendar()
  }, [filters, refreshKey, selectedMode, token, visibleMonth.month, visibleMonth.year])

  useEffect(() => {
    if (!token || selectedMode !== 'yearly') {
      return
    }

    const loadYearlyCalendar = async () => {
      try {
        setIsYearlyLoading(true)
        const response = await fetchRaceCalendarYear(visibleYear, token, filters)
        setYearCalendarData(filterCalendarYearPayload(response, filters.search))
        setYearlyErrorMessage(null)
      } catch (error) {
        setYearlyErrorMessage(
          error instanceof Error
            ? 'Calendar data is temporarily unavailable.'
            : 'Calendar data is temporarily unavailable.',
        )
      } finally {
        setIsYearlyLoading(false)
      }
    }

    void loadYearlyCalendar()
  }, [filters, refreshKey, selectedMode, token, visibleYear])

  const moveMonth = (direction: -1 | 1) => {
    setVisibleMonth((currentValue) => {
      const nextDate = new Date(currentValue.year, currentValue.month - 1 + direction, 1)
      return {
        year: nextDate.getFullYear(),
        month: nextDate.getMonth() + 1,
      }
    })
  }

  const selectMonth = (year: number, month: number) => {
    setVisibleMonth({ year, month })
  }

  const moveYear = (direction: -1 | 1) => {
    setVisibleYear((currentValue) => currentValue + direction)
  }

  const openRaceDetails = async (race: RaceCalendarItem) => {
    if (!token) {
      return
    }

    try {
      setIsDayDrawerOpen(false)
      setIsDetailsOpen(true)
      setIsDetailsLoading(true)
      setDetailsError(null)
      setRaceDetails(null)
      const details = await fetchRaceDetail(race.id, token)
      setRaceDetails(details)
    } catch (loadError) {
      setRaceDetails(null)
      setDetailsError(loadError instanceof Error ? loadError.message : 'Could not load this race right now.')
    } finally {
      setIsDetailsLoading(false)
    }
  }

  const handleDayClick = (races: RaceCalendarItem[]) => {
    if (races.length === 0) {
      return
    }

    if (races.length === 1) {
      void openRaceDetails(races[0])
      return
    }

    setSelectedDay({
      date: races[0].raceDate,
      races,
    })
    setIsDayDrawerOpen(true)
  }

  return (
    <>
      {selectedMode === 'monthly' ? (
        <RacesCalendarMonthlyView
          year={calendarData?.year ?? visibleMonth.year}
          month={calendarData?.month ?? visibleMonth.month}
          days={calendarData?.days ?? []}
          isLoading={isMonthlyLoading}
          errorMessage={monthlyErrorMessage}
          onPreviousMonth={() => moveMonth(-1)}
          onNextMonth={() => moveMonth(1)}
          onMonthSelect={selectMonth}
          onDayClick={handleDayClick}
        />
      ) : (
        <RacesCalendarYearlyView
          year={yearCalendarData?.year ?? visibleYear}
          months={yearCalendarData?.months ?? []}
          isLoading={isYearlyLoading}
          errorMessage={yearlyErrorMessage}
          onPreviousYear={() => moveYear(-1)}
          onNextYear={() => moveYear(1)}
          onDayClick={handleDayClick}
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
            <span className={styles.dayDrawerEyebrow}>Race day</span>
            <span className={styles.dayDrawerDate}>{formatDayDrawerDate(selectedDay.date)}</span>
          </div>
        ) : 'Race day'}
      >
        {selectedDay ? (
          <>
            <div className={styles.dayRaceList}>
              {selectedDay.races.map((race) => (
                <button
                  key={race.id}
                  type="button"
                  className={styles.dayRaceButton}
                  onClick={() => void openRaceDetails(race)}
                >
                  <div className={styles.dayRaceHeader}>
                    <Tooltip title={race.name}>
                      <span className={styles.dayRaceName}>{race.name}</span>
                    </Tooltip>
                    <span className={`${styles.dayRaceStatus} ${getStatusClassName(race.raceStatus)}`.trim()}>
                      {formatStatusLabel(race.raceStatus)}
                    </span>
                  </div>

                  <div className={styles.dayRaceMeta}>
                    <div className={styles.dayRaceMetaItem}>
                      <span className={styles.dayRaceMetaLabel}>Time</span>
                      <span className={styles.dayRaceMetaValue}>{formatDisplayTime(race.raceTime)}</span>
                    </div>
                    <div className={styles.dayRaceMetaItem}>
                      <span className={styles.dayRaceMetaLabel}>Race type</span>
                      <Tooltip title={race.raceTypeName ?? '-'}>
                        <span className={styles.dayRaceMetaValue}>{race.raceTypeName ?? '-'}</span>
                      </Tooltip>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </>
        ) : null}
      </Drawer>

      <RaceDetailsDrawer
        open={isDetailsOpen}
        race={raceDetails}
        isLoading={isDetailsLoading}
        error={detailsError}
        onClose={() => {
          setIsDetailsOpen(false)
          setRaceDetails(null)
          setDetailsError(null)
          if (selectedDay && selectedDay.races.length > 1) {
            setIsDayDrawerOpen(true)
          }
        }}
      />
    </>
  )
}

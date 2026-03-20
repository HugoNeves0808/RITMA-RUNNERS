import { useEffect, useState } from 'react'
import { useAuth } from '../../auth'
import { fetchRaceCalendarMonth, fetchRaceCalendarYear } from '../services/racesCalendarService'
import type { RaceFilters } from '../types/raceFilters'
import type { RaceCalendarMonthPayload, RaceCalendarYearPayload } from '../types/racesCalendar'
import type { RacesCalendarMode } from '../types/racesCalendarMode'
import { RacesCalendarMonthlyView } from './RacesCalendarMonthlyView'
import { RacesCalendarYearlyView } from './RacesCalendarYearlyView'

type RacesCalendarViewProps = {
  selectedMode: RacesCalendarMode
  onModeChange: (mode: RacesCalendarMode) => void
  filters: RaceFilters
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

export function RacesCalendarView({ selectedMode, filters }: RacesCalendarViewProps) {
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
  }, [filters, selectedMode, token, visibleMonth.month, visibleMonth.year])

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
  }, [filters, selectedMode, token, visibleYear])

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
        />
      ) : (
        <RacesCalendarYearlyView
          year={yearCalendarData?.year ?? visibleYear}
          months={yearCalendarData?.months ?? []}
          isLoading={isYearlyLoading}
          errorMessage={yearlyErrorMessage}
          onPreviousYear={() => moveYear(-1)}
          onNextYear={() => moveYear(1)}
        />
      )}
    </>
  )
}

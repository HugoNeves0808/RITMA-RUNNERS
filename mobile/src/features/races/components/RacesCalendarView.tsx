import { useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { fetchRaceCalendarMonth, fetchRaceCalendarYear } from '../services/racesCalendarService'
import type { RaceFilters } from '../types/raceFilters'
import type { RaceCalendarMonthPayload, RaceCalendarYearPayload } from '../types/racesCalendar'
import type { RacesCalendarMode } from '../types/racesCalendarMode'
import { RacesCalendarMonthlyView } from './RacesCalendarMonthlyView'
import { RacesCalendarYearlyView } from './RacesCalendarYearlyView'

type RacesCalendarViewProps = {
  token: string
  selectedMode: RacesCalendarMode
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

export function RacesCalendarView({ token, selectedMode, filters }: RacesCalendarViewProps) {
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const today = new Date()
    return { year: today.getFullYear(), month: today.getMonth() + 1 }
  })
  const [visibleYear, setVisibleYear] = useState(() => new Date().getFullYear())
  const [calendarData, setCalendarData] = useState<RaceCalendarMonthPayload | null>(null)
  const [yearCalendarData, setYearCalendarData] = useState<RaceCalendarYearPayload | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isYearLoading, setIsYearLoading] = useState(false)
  const [yearErrorMessage, setYearErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (selectedMode !== 'monthly') {
      return
    }

    const loadMonthlyCalendar = async () => {
      try {
        setIsLoading(true)
        const response = await fetchRaceCalendarMonth(visibleMonth.year, visibleMonth.month, token, filters)
        setCalendarData(filterCalendarMonthPayload(response, filters.search))
        setErrorMessage(null)
      } catch {
        setErrorMessage('Calendar data is temporarily unavailable.')
      } finally {
        setIsLoading(false)
      }
    }

    void loadMonthlyCalendar()
  }, [filters, selectedMode, token, visibleMonth.month, visibleMonth.year])

  useEffect(() => {
    if (selectedMode !== 'yearly') {
      return
    }

    const loadYearlyCalendar = async () => {
      try {
        setIsYearLoading(true)
        const response = await fetchRaceCalendarYear(visibleYear, token, filters)
        setYearCalendarData(filterCalendarYearPayload(response, filters.search))
        setYearErrorMessage(null)
      } catch {
        setYearErrorMessage('Calendar data is temporarily unavailable.')
      } finally {
        setIsYearLoading(false)
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
    <View style={styles.container}>
      {selectedMode === 'monthly' ? (
        <RacesCalendarMonthlyView
          year={calendarData?.year ?? visibleMonth.year}
          month={calendarData?.month ?? visibleMonth.month}
          days={calendarData?.days ?? []}
          isLoading={isLoading}
          errorMessage={errorMessage}
          onPreviousMonth={() => moveMonth(-1)}
          onNextMonth={() => moveMonth(1)}
        />
      ) : (
        <RacesCalendarYearlyView
          year={yearCalendarData?.year ?? visibleYear}
          months={yearCalendarData?.months ?? []}
          isLoading={isYearLoading}
          errorMessage={yearErrorMessage}
          onPreviousYear={() => moveYear(-1)}
          onNextYear={() => moveYear(1)}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
})

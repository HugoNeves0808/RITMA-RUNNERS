import { useEffect, useState } from 'react'
import { useAuth } from '../../auth'
import { fetchRaceCalendarMonth, fetchRaceCalendarYear } from '../services/racesCalendarService'
import type { RaceCalendarMonthPayload, RaceCalendarYearPayload } from '../types/racesCalendar'
import type { RacesCalendarMode } from '../types/racesCalendarMode'
import { RacesCalendarMonthlyView } from './RacesCalendarMonthlyView'
import { RacesCalendarYearlyView } from './RacesCalendarYearlyView'

type RacesCalendarViewProps = {
  selectedMode: RacesCalendarMode
  onModeChange: (mode: RacesCalendarMode) => void
}

export function RacesCalendarView({ selectedMode }: RacesCalendarViewProps) {
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
        const response = await fetchRaceCalendarMonth(visibleMonth.year, visibleMonth.month, token)
        setCalendarData(response)
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
  }, [selectedMode, token, visibleMonth.month, visibleMonth.year])

  useEffect(() => {
    if (!token || selectedMode !== 'yearly') {
      return
    }

    const loadYearlyCalendar = async () => {
      try {
        setIsYearlyLoading(true)
        const response = await fetchRaceCalendarYear(visibleYear, token)
        setYearCalendarData(response)
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
  }, [selectedMode, token, visibleYear])

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

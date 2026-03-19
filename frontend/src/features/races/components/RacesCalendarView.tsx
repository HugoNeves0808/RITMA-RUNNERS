import { useEffect, useState } from 'react'
import { useAuth } from '../../auth'
import { fetchRaceCalendarMonth } from '../services/racesCalendarService'
import type { RaceCalendarMonthPayload } from '../types/racesCalendar'
import type { RacesCalendarMode } from '../types/racesCalendarMode'
import { RacesCalendarMonthlyView } from './RacesCalendarMonthlyView'
import { RacesCalendarYearlyView } from './RacesCalendarYearlyView'

type RacesCalendarViewProps = {
  selectedMode: RacesCalendarMode
  onModeChange: (mode: RacesCalendarMode) => void
}

export function RacesCalendarView({ selectedMode }: RacesCalendarViewProps) {
  const { token } = useAuth()
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const today = new Date()
    return { year: today.getFullYear(), month: today.getMonth() + 1 }
  })
  const [calendarData, setCalendarData] = useState<RaceCalendarMonthPayload | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!token || selectedMode !== 'monthly') {
      return
      }

      const loadMonthlyCalendar = async () => {
      try {
        setIsLoading(true)
        const response = await fetchRaceCalendarMonth(visibleMonth.year, visibleMonth.month, token)
        setCalendarData(response)
        setErrorMessage(null)
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? 'Calendar data is temporarily unavailable.'
            : 'Calendar data is temporarily unavailable.',
        )
      } finally {
        setIsLoading(false)
      }
    }

    void loadMonthlyCalendar()
  }, [selectedMode, token, visibleMonth.month, visibleMonth.year])

  const moveMonth = (direction: -1 | 1) => {
    setVisibleMonth((currentValue) => {
      const nextDate = new Date(currentValue.year, currentValue.month - 1 + direction, 1)
      return {
        year: nextDate.getFullYear(),
        month: nextDate.getMonth() + 1,
      }
    })
  }

  return (
    <>
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
        <RacesCalendarYearlyView />
      )}
    </>
  )
}

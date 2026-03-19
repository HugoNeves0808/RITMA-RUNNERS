import { apiGet } from '../../../services/apiClient'
import type { RaceCalendarMonthPayload, RaceCalendarYearPayload } from '../types/racesCalendar'

export function fetchRaceCalendarMonth(year: number, month: number, token: string) {
  const params = new URLSearchParams({
    year: String(year),
    month: String(month),
  })

  return apiGet<RaceCalendarMonthPayload>(`/api/races/calendar?${params.toString()}`, token, {
    suppressUnauthorized: true,
  })
}

export function fetchRaceCalendarYear(year: number, token: string) {
  const params = new URLSearchParams({
    year: String(year),
  })

  return apiGet<RaceCalendarYearPayload>(`/api/races/calendar/yearly?${params.toString()}`, token, {
    suppressUnauthorized: true,
  })
}

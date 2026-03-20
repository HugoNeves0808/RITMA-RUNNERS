import { apiGet } from '../../../services/apiClient'
import type { RaceFilters } from '../types/raceFilters'
import type { RaceCalendarMonthPayload, RaceCalendarYearPayload } from '../types/racesCalendar'
import { appendRaceFilters } from './sharedRaceFilters'

export function fetchRaceCalendarMonth(year: number, month: number, token: string, filters?: RaceFilters) {
  const params = new URLSearchParams({
    year: String(year),
    month: String(month),
  })
  appendRaceFilters(params, filters)

  return apiGet<RaceCalendarMonthPayload>(`/api/races/calendar?${params.toString()}`, token, {
    suppressUnauthorized: true,
  })
}

export function fetchRaceCalendarYear(year: number, token: string, filters?: RaceFilters) {
  const params = new URLSearchParams({
    year: String(year),
  })
  appendRaceFilters(params, filters)

  return apiGet<RaceCalendarYearPayload>(`/api/races/calendar/yearly?${params.toString()}`, token, {
    suppressUnauthorized: true,
  })
}

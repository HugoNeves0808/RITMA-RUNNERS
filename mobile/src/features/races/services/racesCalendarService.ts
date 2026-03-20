import { apiRequest } from '../../../services/apiClient'
import type { RaceFilters } from '../types/raceFilters'
import type { RaceCalendarMonthPayload, RaceCalendarYearPayload } from '../types/racesCalendar'
import { appendRaceFilters } from './sharedRaceFilters'

export function fetchRaceCalendarMonth(year: number, month: number, token: string, filters?: RaceFilters) {
  const params = new URLSearchParams({
    year: String(year),
    month: String(month),
  })
  appendRaceFilters(params, filters)

  return apiRequest<RaceCalendarMonthPayload>(`/api/races/calendar?${params.toString()}`, {
    token,
  })
}

export function fetchRaceCalendarYear(year: number, token: string, filters?: RaceFilters) {
  const params = new URLSearchParams({
    year: String(year),
  })
  appendRaceFilters(params, filters)

  return apiRequest<RaceCalendarYearPayload>(`/api/races/calendar/yearly?${params.toString()}`, {
    token,
  })
}

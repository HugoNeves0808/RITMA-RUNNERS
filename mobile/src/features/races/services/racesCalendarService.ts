import { apiRequest } from '../../../services/apiClient'
import type { RaceCalendarMonthPayload, RaceCalendarYearPayload } from '../types/racesCalendar'

export function fetchRaceCalendarMonth(year: number, month: number, token: string) {
  return apiRequest<RaceCalendarMonthPayload>(`/api/races/calendar?year=${year}&month=${month}`, {
    token,
  })
}

export function fetchRaceCalendarYear(year: number, token: string) {
  return apiRequest<RaceCalendarYearPayload>(`/api/races/calendar/yearly?year=${year}`, {
    token,
  })
}

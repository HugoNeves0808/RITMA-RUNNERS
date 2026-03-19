import { apiRequest } from '../../../services/apiClient'
import type { RaceCalendarMonthPayload } from '../types/racesCalendar'

export function fetchRaceCalendarMonth(year: number, month: number, token: string) {
  return apiRequest<RaceCalendarMonthPayload>(`/api/races/calendar?year=${year}&month=${month}`, {
    token,
  })
}

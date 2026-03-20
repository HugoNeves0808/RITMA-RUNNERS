import { apiDeleteWithToken, apiGet, apiPutWithToken } from '../../../services/apiClient'
import type {
  RaceTableItem,
  RaceTablePayload,
  RaceTypeOption,
  UpdateRaceTableItemPayload,
} from '../types/racesTable'
import type { RaceFilterOptions, RaceFilters } from '../types/raceFilters'
import { appendRaceFilters } from './sharedRaceFilters'

export function fetchRaceTable(token: string, filters?: RaceFilters) {
  const params = new URLSearchParams()
  appendRaceFilters(params, filters)
  const query = params.toString()

  return apiGet<RaceTablePayload>(`/api/races/table${query ? `?${query}` : ''}`, token, {
    suppressUnauthorized: true,
  })
}

export function fetchRaceTypes(token: string) {
  return apiGet<RaceTypeOption[]>('/api/races/types', token, {
    suppressUnauthorized: true,
  })
}

export function fetchRaceFilterOptions(token: string) {
  return apiGet<RaceFilterOptions>('/api/races/filters/options', token, {
    suppressUnauthorized: true,
  })
}

export function updateRaceTableItem(raceId: string, payload: UpdateRaceTableItemPayload, token: string) {
  return apiPutWithToken<RaceTableItem>(`/api/races/${raceId}`, payload, token)
}

export function deleteRaceTableItems(raceIds: string[], token: string) {
  return apiDeleteWithToken<void>('/api/races/bulk', token, { raceIds })
}

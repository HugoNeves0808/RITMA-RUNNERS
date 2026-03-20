import { apiDeleteWithToken, apiGet, apiPutWithToken } from '../../../services/apiClient'
import type {
  RaceTableItem,
  RaceTablePayload,
  RaceTypeOption,
  UpdateRaceTableItemPayload,
} from '../types/racesTable'

export function fetchRaceTable(token: string) {
  return apiGet<RaceTablePayload>('/api/races/table', token, {
    suppressUnauthorized: true,
  })
}

export function fetchRaceTypes(token: string) {
  return apiGet<RaceTypeOption[]>('/api/races/types', token, {
    suppressUnauthorized: true,
  })
}

export function updateRaceTableItem(raceId: string, payload: UpdateRaceTableItemPayload, token: string) {
  return apiPutWithToken<RaceTableItem>(`/api/races/${raceId}`, payload, token)
}

export function deleteRaceTableItems(raceIds: string[], token: string) {
  return apiDeleteWithToken<void>('/api/races/bulk', token, { raceIds })
}

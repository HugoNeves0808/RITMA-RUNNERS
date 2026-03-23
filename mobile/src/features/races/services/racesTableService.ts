import { apiRequest } from '../../../services/apiClient'
import type {
  CreateRacePayload,
  CreateRaceResponse,
  RaceTableItem,
  RaceTablePayload,
  RaceTypeOption,
  UpdateRaceTableItemPayload,
} from '../types/racesTable'
import type { RaceFilters } from '../types/raceFilters'
import { appendRaceFilters } from './sharedRaceFilters'

export function fetchRaceTable(token: string, filters?: RaceFilters) {
  const params = new URLSearchParams()
  appendRaceFilters(params, filters)
  const query = params.toString()

  return apiRequest<RaceTablePayload>(`/api/races/table${query ? `?${query}` : ''}`, {
    token,
  })
}

export function fetchRaceTypes(token: string) {
  return apiRequest<RaceTypeOption[]>('/api/races/types', {
    token,
  })
}

export function createRace(payload: CreateRacePayload, token: string) {
  return apiRequest<CreateRaceResponse>('/api/races', {
    method: 'POST',
    token,
    body: payload,
  })
}

export function updateRaceTableItem(raceId: string, payload: UpdateRaceTableItemPayload, token: string) {
  return apiRequest<RaceTableItem>(`/api/races/${raceId}`, {
    method: 'PUT',
    token,
    body: payload,
  })
}

export function deleteRaceTableItems(raceIds: string[], token: string) {
  return apiRequest<void>('/api/races/bulk', {
    method: 'DELETE',
    token,
    body: { raceIds },
  })
}

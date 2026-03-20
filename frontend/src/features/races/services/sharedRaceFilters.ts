import type { RaceFilters } from '../types/raceFilters'

export function appendRaceFilters(params: URLSearchParams, filters?: RaceFilters) {
  if (!filters) {
    return
  }

  filters.statuses.forEach((status) => {
    params.append('statuses', status)
  })

  if (filters.year != null) {
    params.append('years', String(filters.year))
  }

  filters.raceTypeIds.forEach((raceTypeId) => {
    params.append('raceTypeIds', raceTypeId)
  })
}

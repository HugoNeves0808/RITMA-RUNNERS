import type { RaceTypeOption } from './racesTable'

export type RaceFilters = {
  search: string
  statuses: string[]
  year: number | null
  raceTypeIds: string[]
}

export type RaceFilterOptions = {
  years: number[]
  raceTypes: RaceTypeOption[]
}

export const EMPTY_RACE_FILTERS: RaceFilters = {
  search: '',
  statuses: [],
  year: null,
  raceTypeIds: [],
}

export const IN_LIST_WITHOUT_DATE_STATUS = 'IN_LIST_WITHOUT_DATE'

export const RACE_STATUS_OPTIONS = [
  { value: 'REGISTERED', labelKey: 'races.status.registered' },
  { value: 'COMPLETED', labelKey: 'races.status.completed' },
  { value: 'IN_LIST', labelKey: 'races.status.futureWithDate' },
  { value: IN_LIST_WITHOUT_DATE_STATUS, labelKey: 'races.status.futureWithoutDate' },
  { value: 'NOT_REGISTERED', labelKey: 'races.status.waitingRegistration' },
  { value: 'CANCELLED', labelKey: 'races.status.cancelled' },
  { value: 'DID_NOT_START', labelKey: 'races.status.didNotStart' },
  { value: 'DID_NOT_FINISH', labelKey: 'races.status.didNotFinish' },
] as const

export type RaceStatusValue = (typeof RACE_STATUS_OPTIONS)[number]['value']

export function getRaceStatusLabel(
  status: string,
  t: (key: string) => string,
) {
  const option = RACE_STATUS_OPTIONS.find((candidate) => candidate.value === status)
  return option ? t(option.labelKey) : status
}

export function getRaceStatusColor(status: string) {
  switch (status) {
    case 'REGISTERED':
      return '#fbbf24'
    case 'COMPLETED':
      return '#15803d'
    case 'IN_LIST':
    case IN_LIST_WITHOUT_DATE_STATUS:
      return '#b45309'
    case 'NOT_REGISTERED':
      return '#4b5563'
    case 'CANCELLED':
      return '#b91c1c'
    case 'DID_NOT_START':
      return '#be185d'
    case 'DID_NOT_FINISH':
      return '#6d28d9'
    default:
      return '#475467'
  }
}

export function getRaceStatusBackgroundColor(status: string) {
  switch (status) {
    case 'REGISTERED':
      return 'rgba(251, 191, 36, 0.2)'
    case 'COMPLETED':
      return 'rgba(22, 163, 74, 0.12)'
    case 'IN_LIST':
    case IN_LIST_WITHOUT_DATE_STATUS:
      return 'rgba(245, 158, 11, 0.14)'
    case 'NOT_REGISTERED':
      return 'rgba(107, 114, 128, 0.14)'
    case 'CANCELLED':
      return 'rgba(220, 38, 38, 0.12)'
    case 'DID_NOT_START':
      return 'rgba(190, 24, 93, 0.12)'
    case 'DID_NOT_FINISH':
      return 'rgba(124, 58, 237, 0.12)'
    default:
      return 'rgba(16, 24, 40, 0.06)'
  }
}

export function countActiveRaceFilters(filters: RaceFilters) {
  let count = 0

  if (filters.statuses.length > 0) {
    count += 1
  }

  if (filters.raceTypeIds.length > 0) {
    count += 1
  }

  return count
}

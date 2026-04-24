export type TrainingStatus = 'PLANEADO' | 'REALIZADO'

export type TrainingTableItem = {
  id: string
  trainingDate: string
  trainingTime: string | null
  createdAt: string
  name: string
  trainingTypeId: string | null
  trainingTypeName: string | null
  notes: string | null
  trainingStatus: TrainingStatus
  completed: boolean
  associatedRaceId: string | null
  associatedRaceName: string | null
  associatedRaceDate: string | null
  seriesId: string | null
  seriesIntervalWeeks: number | null
  seriesUntilDate: string | null
  seriesDaysOfWeek: number[]
}

export type TrainingTableResponse = {
  trainings: TrainingTableItem[]
}

export type TrainingTypeOption = {
  id: string
  name: string
  archived: boolean
}

export type TrainingTypeUsage = {
  usageCount: number
  records: TrainingTypeUsageItem[]
}

export type TrainingTypeUsageItem = {
  trainingId: string
  trainingName: string
  trainingDate: string | null
}

export type AssociatedRaceOption = {
  id: string
  name: string
  raceDate: string | null
  raceStatus: string | null
}

export type TrainingCreateOptions = {
  trainingTypes: TrainingTypeOption[]
  races: AssociatedRaceOption[]
}

export type TrainingFilterOptions = {
  trainingTypes: TrainingTypeOption[]
}

export type TrainingFilters = {
  search: string
  statuses: TrainingStatus[]
  trainingTypeIds: string[]
  associations: Array<'associated' | 'individual'>
}

export type TrainingRequest = {
  trainingDate: string
  trainingTime: string | null
  name: string
  trainingTypeId: string | null
  notes: string | null
  associatedRaceId: string | null
  recurrence: {
    enabled: boolean
    intervalWeeks: number | null
    untilDate: string | null
    daysOfWeek: number[]
  } | null
}

export const EMPTY_TRAINING_FILTERS: TrainingFilters = {
  search: '',
  statuses: [],
  trainingTypeIds: [],
  associations: [],
}

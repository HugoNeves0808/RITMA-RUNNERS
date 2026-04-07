export type RaceTableItem = {
  id: string
  raceNumber: number
  raceDate: string | null
  raceTime: string | null
  raceStatus?: string | null
  name: string
  location: string | null
  circuitId: string | null
  circuitName: string | null
  raceTypeId: string | null
  raceTypeName: string | null
  officialTimeSeconds: number | null
  chipTimeSeconds: number | null
  pacePerKmSeconds: number | null
}

export type RaceTableYearGroup = {
  year: number
  races: RaceTableItem[]
}

export type TableYearSelection = {
  allRaces: boolean
  selectedYears: number[]
}

export type RaceTablePayload = {
  years: RaceTableYearGroup[]
  undatedRaces: RaceTableItem[]
}

export type RaceTypeOption = {
  id: string
  name: string
  targetKm: number | null
}

export type ManagedRaceOptionType = 'race-types' | 'teams' | 'circuits' | 'shoes'

export type ManageRaceOptionPayload = {
  name: string
  targetKm?: number | null
}

export type RaceOptionUsageItem = {
  raceId: string
  raceName: string
  raceDate: string | null
  contextLabel: string
}

export type RaceOptionUsage = {
  optionType: ManagedRaceOptionType
  usageCount: number
  records: RaceOptionUsageItem[]
}

export type RaceCreateOptions = {
  raceTypes: RaceTypeOption[]
  teams: RaceTypeOption[]
  circuits: RaceTypeOption[]
  shoes: RaceTypeOption[]
}

export type CreateRacePayload = {
  race: {
    raceStatus: string
    raceDate: string | null
    raceTime: string | null
    name: string
    location: string | null
    teamId: string | null
    circuitId: string | null
    raceTypeId: string | null
    realKm: number | null
    elevation: number | null
    isValidForCategoryRanking: boolean
  }
  results: {
    officialTimeSeconds: number | null
    chipTimeSeconds: number | null
    pacePerKmSeconds: number | null
    shoeId: string | null
    generalClassification: number | null
    isGeneralClassificationPodium: boolean
    ageGroupClassification: number | null
    isAgeGroupClassificationPodium: boolean
    teamClassification: number | null
    isTeamClassificationPodium: boolean
  }
  analysis: {
    preRaceConfidence: string | null
    raceDifficulty: string | null
    finalSatisfaction: string | null
    painInjuries: string | null
    analysisNotes: string | null
    wouldRepeatThisRace: boolean | null
  }
}

export type UpdateRaceTableItemPayload = CreateRacePayload

export type CreateRaceResponse = {
  id: string
}

export type RaceDetailResponse = {
  id: string
  race: {
    raceStatus: string | null
    raceDate: string | null
    raceTime: string | null
    name: string
    location: string | null
    teamId: string | null
    teamName: string | null
    circuitId: string | null
    circuitName: string | null
    raceTypeId: string | null
    raceTypeName: string | null
    realKm: number | null
    elevation: number | null
    isValidForCategoryRanking: boolean | null
  }
  results: {
    officialTimeSeconds: number | null
    chipTimeSeconds: number | null
    pacePerKmSeconds: number | null
    shoeId: string | null
    shoeName: string | null
    generalClassification: number | null
    isGeneralClassificationPodium: boolean | null
    ageGroupClassification: number | null
    isAgeGroupClassificationPodium: boolean | null
    teamClassification: number | null
    isTeamClassificationPodium: boolean | null
  }
  analysis: {
    preRaceConfidence: string | null
    raceDifficulty: string | null
    finalSatisfaction: string | null
    painInjuries: string | null
    analysisNotes: string | null
    wouldRepeatThisRace: boolean | null
  }
}

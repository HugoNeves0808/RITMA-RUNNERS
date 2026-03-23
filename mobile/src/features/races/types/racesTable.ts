export type RaceTableItem = {
  id: string
  raceNumber: number
  raceDate: string
  raceTime: string | null
  raceStatus?: string | null
  name: string
  location: string | null
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

export type RaceTablePayload = {
  years: RaceTableYearGroup[]
}

export type RaceTypeOption = {
  id: string
  name: string
}

export type UpdateRaceTableItemPayload = {
  raceDate: string
  name: string
  location: string | null
  raceTypeId: string | null
  officialTimeSeconds: number | null
  chipTimeSeconds: number | null
  pacePerKmSeconds: number | null
}

export type CreateRacePayload = {
  race: {
    raceStatus: string
    raceDate: string
    raceTime: string | null
    name: string
    location: string | null
    raceTypeId: string | null
    realKm: number | null
    elevation: number | null
    isValidForCategoryRanking: boolean
  }
  results: {
    officialTimeSeconds: number | null
    chipTimeSeconds: number | null
    pacePerKmSeconds: number | null
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

export type CreateRaceResponse = {
  id: string
}

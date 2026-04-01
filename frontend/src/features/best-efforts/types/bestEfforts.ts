export type BestEffortItem = {
  raceId: string
  raceName: string
  raceDate: string | null
  raceTypeName: string
  realKm: number | null
  chipTimeSeconds: number | null
  officialTimeSeconds: number | null
  pacePerKmSeconds: number | null
  generalClassification: number | null
  isGeneralClassificationPodium: boolean | null
  ageGroupClassification: number | null
  isAgeGroupClassificationPodium: boolean | null
  teamClassification: number | null
  isTeamClassificationPodium: boolean | null
  validForBestEffortRanking: boolean
  rankingNote: string
  classificationPodium: boolean
  classificationGoodPosition: boolean
  overallRank: number
}

export type BestEffortCategory = {
  categoryKey: string
  categoryName: string
  expectedDistanceKm: number | null
  validEffortCount: number
  totalEffortCount: number
  efforts: BestEffortItem[]
}

export type BestEffortPayload = {
  categories: BestEffortCategory[]
}

export type BestEffortsViewMode = 'top-3' | 'top-5' | 'all'

export type BestEffortsDateOrder = 'recent' | 'oldest'

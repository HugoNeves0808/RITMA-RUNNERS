export type ProfileRaceTypeSummary = {
  raceTypeName: string
  raceCount: number
  bestEffortsTracked: number
}

export type ProfileSummary = {
  totalRaces: number
  completedRaces: number
  favoriteRaceType: string | null
  podiums: number
  topRaceTypes: ProfileRaceTypeSummary[]
}

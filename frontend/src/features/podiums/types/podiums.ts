export type PodiumType = 'GENERAL' | 'AGE_GROUP' | 'TEAM'

export type PodiumHistoryItem = {
  podiumKey: string
  raceId: string
  raceName: string
  raceDate: string | null
  location: string | null
  raceTypeName: string | null
  teamName: string | null
  circuitName: string | null
  officialTimeSeconds: number | null
  chipTimeSeconds: number | null
  pacePerKmSeconds: number | null
  podiumType: PodiumType
  podiumPosition: number
}

export type PodiumHistoryPayload = {
  items: PodiumHistoryItem[]
}

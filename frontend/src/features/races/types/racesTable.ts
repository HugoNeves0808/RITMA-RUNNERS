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

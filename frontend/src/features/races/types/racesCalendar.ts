export type RaceCalendarItem = {
  id: string
  name: string
  raceTypeName: string | null
  raceStatus: string
  raceDate: string
  raceTime: string | null
  realKm: number | null
  elevation: number | null
  archived: boolean
  isValidForCategoryRanking: boolean
}

export type RaceCalendarDay = {
  date: string
  races: RaceCalendarItem[]
}

export type RaceCalendarMonthPayload = {
  year: number
  month: number
  days: RaceCalendarDay[]
}

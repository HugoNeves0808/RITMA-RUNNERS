export type TrainingCalendarRaceItem = {
  kind: 'race'
  id: string
  name: string
  date: string
  time: string | null
  subtitle: string | null
  status: string
}

export type TrainingCalendarTrainingItem = {
  kind: 'training'
  id: string
  name: string
  date: string
  time: string | null
  createdAt: string
  subtitle: string | null
  status: 'PLANEADO' | 'REALIZADO'
}

export type TrainingCalendarItem = TrainingCalendarRaceItem | TrainingCalendarTrainingItem

export type TrainingCalendarDay = {
  date: string
  items: TrainingCalendarItem[]
}

export type TrainingCalendarYearMonth = {
  month: number
  days: TrainingCalendarDay[]
}

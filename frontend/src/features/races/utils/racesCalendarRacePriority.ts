import type { RaceCalendarItem } from '../types/racesCalendar'

const STATUS_PRIORITY: Record<string, number> = {
  CANCELLED: 1,
  DID_NOT_FINISH: 2,
  NOT_REGISTERED: 3,
  REGISTERED: 4,
  COMPLETED: 5,
  IN_LIST: 6,
  DID_NOT_START: 7,
}

export function compareRaceCalendarItems(left: RaceCalendarItem, right: RaceCalendarItem) {
  if (left.raceTime && right.raceTime) {
    const timeComparison = left.raceTime.localeCompare(right.raceTime)
    if (timeComparison !== 0) {
      return timeComparison
    }
  }

  if (left.raceTime && !right.raceTime) {
    return -1
  }

  if (!left.raceTime && right.raceTime) {
    return 1
  }

  const statusComparison = (STATUS_PRIORITY[left.raceStatus] ?? Number.MAX_SAFE_INTEGER)
    - (STATUS_PRIORITY[right.raceStatus] ?? Number.MAX_SAFE_INTEGER)

  if (statusComparison !== 0) {
    return statusComparison
  }

  return left.name.localeCompare(right.name)
}

export function getPrimaryRaceForDay(races: RaceCalendarItem[]) {
  if (races.length === 0) {
    return null
  }

  return [...races].sort(compareRaceCalendarItems)[0]
}

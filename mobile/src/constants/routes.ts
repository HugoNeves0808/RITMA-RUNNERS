export const routes = {
  login: 'login',
  futureGoals: 'futureGoals',
  home: 'home',
  races: 'races',
  bestEfforts: 'bestEfforts',
  profile: 'profile',
  settings: 'settings',
} as const

export type MobileRoute = (typeof routes)[keyof typeof routes]

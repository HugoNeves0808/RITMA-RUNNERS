export const routes = {
  login: 'login',
  futureGoals: 'futureGoals',
  home: 'home',
} as const

export type MobileRoute = (typeof routes)[keyof typeof routes]

export const routes = {
  login: 'login',
  futureGoals: 'futureGoals',
} as const

export type MobileRoute = (typeof routes)[keyof typeof routes]

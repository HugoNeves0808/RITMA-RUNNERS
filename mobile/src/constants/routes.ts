export const routes = {
  login: 'login',
  futureGoals: 'futureGoals',
  home: 'home',
  races: 'races',
  bestEfforts: 'bestEfforts',
  profile: 'profile',
  settings: 'settings',
  adminRitmaOverview: 'adminRitmaOverview',
  adminUserList: 'adminUserList',
  adminPendingApprovals: 'adminPendingApprovals',
} as const

export type MobileRoute = (typeof routes)[keyof typeof routes]

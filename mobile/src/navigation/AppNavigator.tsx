import { useState } from 'react'
import { routes, type MobileRoute } from '../constants/routes'
import { FutureGoalsScreen } from '../screens/FutureGoalsScreen/FutureGoalsScreen'
import { LoginScreen } from '../screens/LoginScreen/LoginScreen'

export function AppNavigator() {
  const [currentRoute, setCurrentRoute] = useState<MobileRoute>(routes.login)

  if (currentRoute === routes.futureGoals) {
    return <FutureGoalsScreen onBack={() => setCurrentRoute(routes.login)} />
  }

  return <LoginScreen onOpenFutureGoals={() => setCurrentRoute(routes.futureGoals)} />
}

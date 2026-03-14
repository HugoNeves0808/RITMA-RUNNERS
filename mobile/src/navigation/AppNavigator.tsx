import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { useEffect, useState } from 'react'
import { ForcePasswordChangeModal } from '../features/auth/components/ForcePasswordChangeModal'
import { changePassword, getCurrentUser } from '../features/auth/services/authService'
import { clearAuthSession, loadAuthSession, saveAuthSession } from '../features/auth/services/authStorage'
import type { AuthSession } from '../features/auth/types/auth'
import { routes, type MobileRoute } from '../constants/routes'
import { FutureGoalsScreen } from '../screens/FutureGoalsScreen/FutureGoalsScreen'
import { HomeScreen } from '../screens/HomeScreen/HomeScreen'
import { LoginScreen } from '../screens/LoginScreen/LoginScreen'
import { colors } from '../theme/colors'

export function AppNavigator() {
  const [currentRoute, setCurrentRoute] = useState<MobileRoute>(routes.login)
  const [authSession, setAuthSession] = useState<AuthSession | null>(null)
  const [isHydrating, setIsHydrating] = useState(true)

  useEffect(() => {
    async function restoreSession() {
      try {
        const storedSession = await loadAuthSession()
        if (!storedSession) {
          return
        }

        const user = await getCurrentUser(storedSession.token)
        const restoredSession = { token: storedSession.token, user }
        setAuthSession(restoredSession)
        await saveAuthSession(restoredSession)
        setCurrentRoute(routes.home)
      } catch {
        await clearAuthSession()
        setAuthSession(null)
        setCurrentRoute(routes.login)
      } finally {
        setIsHydrating(false)
      }
    }

    restoreSession()
  }, [])

  const handleLoginSuccess = async (session: AuthSession) => {
    setAuthSession(session)
    setCurrentRoute(routes.home)
    await saveAuthSession(session)
  }

  const handleLogout = async () => {
    setAuthSession(null)
    setCurrentRoute(routes.login)
    await clearAuthSession()
  }

  const handlePasswordChange = async (payload: { currentPassword: string; newPassword: string }) => {
    if (!authSession) {
      throw new Error('You must be signed in to change your password.')
    }

    await changePassword(payload, authSession.token)
    const nextSession = {
      ...authSession,
      user: {
        ...authSession.user,
        forcePasswordChange: false,
      },
    }

    setAuthSession(nextSession)
    await saveAuthSession(nextSession)
  }

  if (isHydrating) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={colors.teal} />
      </View>
    )
  }

  if (authSession) {
    if (authSession.user.forcePasswordChange) {
      return (
        <>
          <View style={styles.blankState} />
          <ForcePasswordChangeModal
            visible
            onSubmit={handlePasswordChange}
            onLogout={handleLogout}
          />
        </>
      )
    }

    return (
      <>
        <HomeScreen user={authSession.user} onLogout={handleLogout} />
        <ForcePasswordChangeModal
          visible={false}
          onSubmit={handlePasswordChange}
          onLogout={handleLogout}
        />
      </>
    )
  }

  if (currentRoute === routes.futureGoals) {
    return <FutureGoalsScreen onBack={() => setCurrentRoute(routes.login)} />
  }

  return (
    <LoginScreen
      onOpenFutureGoals={() => setCurrentRoute(routes.futureGoals)}
      onLoginSuccess={handleLoginSuccess}
    />
  )
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.pageBackground,
  },
  blankState: {
    flex: 1,
    backgroundColor: colors.pageBackground,
  },
})

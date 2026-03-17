import { FontAwesome6 } from '@expo/vector-icons'
import { useEffect, useMemo, useState } from 'react'
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { routes, type MobileRoute } from '../constants/routes'
import type { AuthenticatedUser } from '../features/auth/types/auth'
import { colors } from '../theme/colors'

type AuthenticatedShellProps = {
  currentRoute: MobileRoute
  user: AuthenticatedUser
  onNavigate: (route: MobileRoute) => void
  onLogout: () => void
  children: React.ReactNode
}

type MenuItem = {
  key: string
  label: string
  icon: React.ComponentProps<typeof FontAwesome6>['name']
  isActive: boolean
  onPress: () => void
}

export function AuthenticatedShell({
  currentRoute,
  user,
  onNavigate,
  onLogout,
  children,
}: AuthenticatedShellProps) {
  const insets = useSafeAreaInsets()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false)
  const isAdmin = user.role === 'ADMIN'
  const isInAdminArea =
    currentRoute === routes.adminRitmaOverview
    || currentRoute === routes.adminUserList
    || currentRoute === routes.adminPendingApprovals

  useEffect(() => {
    if (isInAdminArea) {
      setIsAdminMenuOpen(true)
    }
  }, [isInAdminArea])

  const mainItems = useMemo<MenuItem[]>(
    () => [
      {
        key: 'races',
        label: 'Races',
        icon: 'flag-checkered',
        isActive: currentRoute === routes.home || currentRoute === routes.races,
        onPress: () => onNavigate(routes.races),
      },
      {
        key: 'best-efforts',
        label: 'Best Efforts',
        icon: 'ranking-star',
        isActive: currentRoute === routes.bestEfforts,
        onPress: () => onNavigate(routes.bestEfforts),
      },
    ],
    [currentRoute, onNavigate],
  )

  const bottomItems = useMemo<MenuItem[]>(
    () => [
      ...mainItems,
      {
        key: 'profile',
        label: 'Profile',
        icon: 'user',
        isActive: currentRoute === routes.profile,
        onPress: () => onNavigate(routes.profile),
      },
    ],
    [currentRoute, mainItems, onNavigate],
  )

  const accountItems = useMemo<MenuItem[]>(
    () => [
      {
        key: 'profile',
        label: 'Profile',
        icon: 'user',
        isActive: currentRoute === routes.profile,
        onPress: () => onNavigate(routes.profile),
      },
      {
        key: 'settings',
        label: 'Settings',
        icon: 'gear',
        isActive: currentRoute === routes.settings,
        onPress: () => onNavigate(routes.settings),
      },
      {
        key: 'logout',
        label: 'Logout',
        icon: 'right-from-bracket',
        isActive: false,
        onPress: onLogout,
      },
    ],
    [currentRoute, onLogout, onNavigate],
  )

  const adminSubItems = useMemo<MenuItem[]>(
    () => [
      {
        key: 'admin-ritma-overview',
        label: 'RITMA Overview',
        icon: 'map',
        isActive: currentRoute === routes.adminRitmaOverview,
        onPress: () => onNavigate(routes.adminRitmaOverview),
      },
      {
        key: 'admin-user-list',
        label: 'User List',
        icon: 'users',
        isActive: currentRoute === routes.adminUserList,
        onPress: () => onNavigate(routes.adminUserList),
      },
      {
        key: 'admin-pending-approvals',
        label: 'Pending Approvals',
        icon: 'hourglass-half',
        isActive: currentRoute === routes.adminPendingApprovals,
        onPress: () => onNavigate(routes.adminPendingApprovals),
      },
    ],
    [currentRoute, onNavigate],
  )

  const handleItemPress = (item: MenuItem) => {
    setIsMenuOpen(false)
    item.onPress()
  }

  const topBarHeight = insets.top + 56
  const bottomBarHeight = 74 + Math.max(insets.bottom, 10)

  return (
    <SafeAreaView style={styles.page} edges={['left', 'right', 'bottom']}>
      <View style={[styles.topBar, { paddingTop: insets.top, height: topBarHeight }]}>
        <Pressable
          style={styles.topButton}
          onPress={() => setIsMenuOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Open navigation menu"
        >
          <FontAwesome6 name="bars" size={22} color={colors.textPrimary} />
        </Pressable>

        <View style={styles.topLogoWrap} pointerEvents="none">
          <Image
            source={require('../../assets/images/ritma-logo.png')}
            style={styles.topLogo}
            resizeMode="contain"
          />
        </View>

        <Pressable
          style={[styles.topButton, currentRoute === routes.settings ? styles.topButtonActive : null]}
          onPress={() => onNavigate(routes.settings)}
          accessibilityRole="button"
          accessibilityLabel="Open settings"
        >
          <FontAwesome6 name="gear" size={22} color={colors.textPrimary} />
        </Pressable>
      </View>

      <View
        style={[
          styles.contentArea,
          {
            paddingTop: topBarHeight,
            paddingBottom: bottomBarHeight,
          },
        ]}
      >
        {children}
      </View>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        {bottomItems.map((item) => (
          <Pressable
            key={item.key}
            style={styles.bottomItem}
            onPress={item.onPress}
            accessibilityRole="button"
            accessibilityLabel={item.label}
          >
            <View style={[styles.bottomIconWrap, item.isActive ? styles.bottomIconWrapActive : null]}>
              <FontAwesome6
                name={item.icon}
                size={21}
                color={colors.warning}
              />
            </View>
            <Text style={[styles.bottomLabel, item.isActive ? styles.bottomLabelActive : null]}>
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Modal
        visible={isMenuOpen}
        animationType="slide"
        onRequestClose={() => setIsMenuOpen(false)}
      >
        <SafeAreaView style={styles.menuPage} edges={['top', 'left', 'right', 'bottom']}>
          <Pressable style={styles.menuBackButton} onPress={() => setIsMenuOpen(false)}>
            <FontAwesome6 name="chevron-left" size={18} color={colors.primaryButtonText} />
          </Pressable>

          <ScrollView contentContainerStyle={styles.menuPageContent}>
            <Pressable
              style={styles.drawerLogoWrap}
              onPress={() => handleItemPress(mainItems[0])}
            >
              <Image
                source={require('../../assets/images/ritma-logo.png')}
                style={styles.drawerLogo}
                resizeMode="contain"
              />
            </Pressable>

            {isAdmin ? (
              <View style={styles.accountSection}>
                <Pressable
                  style={[styles.menuItem, isInAdminArea ? styles.menuItemActive : null]}
                  onPress={() => setIsAdminMenuOpen((currentValue) => !currentValue)}
                >
                  <FontAwesome6
                    name="shield-halved"
                    size={18}
                    color={colors.warning}
                  />
                  <Text style={[styles.menuLabel, isInAdminArea ? styles.menuLabelActive : null]}>
                    Admin Area
                  </Text>

                  <View style={styles.adminToggle}>
                    <FontAwesome6
                      name={isAdminMenuOpen ? 'angle-down' : 'angle-right'}
                      size={16}
                      color={colors.textSecondary}
                    />
                  </View>
                </Pressable>

                {isAdminMenuOpen ? (
                  <View style={styles.adminSubnav}>
                    {adminSubItems.map((item) => (
                      <Pressable
                        key={item.key}
                        style={[styles.adminSubItem, item.isActive ? styles.adminSubItemActive : null]}
                        onPress={() => handleItemPress(item)}
                      >
                        <FontAwesome6
                          name={item.icon}
                          size={16}
                          color={colors.warning}
                        />
                        <Text style={[styles.menuLabel, item.isActive ? styles.menuLabelActive : null]}>
                          {item.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}
              </View>
            ) : null}

            <View style={styles.accountSection}>
              {mainItems.map((item) => (
                <Pressable
                  key={item.key}
                  style={[styles.menuItem, item.isActive ? styles.menuItemActive : null]}
                  onPress={() => handleItemPress(item)}
                >
                  <FontAwesome6
                    name={item.icon}
                    size={18}
                    color={colors.warning}
                  />
                  <Text style={[styles.menuLabel, item.isActive ? styles.menuLabelActive : null]}>
                    {item.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.accountSection}>
              {accountItems.map((item) => (
                <Pressable
                  key={item.key}
                  style={[styles.menuItem, item.isActive ? styles.menuItemActive : null]}
                  onPress={() => handleItemPress(item)}
                >
                  <FontAwesome6
                    name={item.icon}
                    size={18}
                    color={colors.warning}
                  />
                  <Text style={[styles.menuLabel, item.isActive ? styles.menuLabelActive : null]}>
                    {item.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.drawerFooter}>
              <Text style={styles.userEmail}>{user.email}</Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.pageBackground,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(16, 24, 40, 0.08)',
  },
  topButton: {
    height: 46,
    width: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  topButtonActive: {
    backgroundColor: 'rgba(255, 244, 229, 0.95)',
  },
  topLogoWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topLogo: {
    width: 178,
    height: 46,
  },
  contentArea: {
    flex: 1,
    overflow: 'hidden',
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 0,
    paddingTop: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.97)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(16, 24, 40, 0.08)',
  },
  bottomItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minWidth: 0,
  },
  bottomIconWrap: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 26,
  },
  bottomIconWrapActive: {
    backgroundColor: 'rgba(255, 244, 229, 0.95)',
  },
  bottomLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  bottomLabelActive: {
    color: colors.textPrimary,
  },
  menuPage: {
    flex: 1,
    backgroundColor: colors.pageBackground,
  },
  menuBackButton: {
    position: 'absolute',
    top: 18,
    left: 18,
    zIndex: 10,
    backgroundColor: colors.textPrimary,
    width: 42,
    height: 42,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuPageContent: {
    paddingTop: 84,
    paddingHorizontal: 24,
    paddingBottom: 32,
    gap: 22,
  },
  drawerLogoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  drawerLogo: {
    width: 178,
    height: 52,
  },
  drawerContent: {
    flexGrow: 1,
  },
  menuSection: {
    gap: 10,
  },
  accountSection: {
    gap: 10,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: 'rgba(16, 24, 40, 0.08)',
  },
  adminToggle: {
    marginLeft: 'auto',
    padding: 4,
  },
  adminSubnav: {
    gap: 8,
    paddingLeft: 14,
  },
  adminSubItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 16,
  },
  adminSubItemActive: {
    backgroundColor: 'rgba(255, 244, 229, 0.95)',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 18,
  },
  menuItemActive: {
    backgroundColor: 'rgba(255, 244, 229, 0.95)',
  },
  menuLabel: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  menuLabelActive: {
    color: colors.textPrimary,
  },
  drawerFooter: {
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: 'rgba(16, 24, 40, 0.08)',
  },
  userEmail: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
  },
})

import {
  faFlagCheckered,
  faGear,
  faRankingStar,
  faRightFromBracket,
  faUser,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Button, Layout } from 'antd'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../features/auth'
import { ROUTES } from '../constants/routes'
import styles from './AppShell.module.css'

const { Content } = Layout

export function AppShell({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const { isAuthenticated, logout, user } = useAuth()
  const isLoginPage = location.pathname === ROUTES.login
  const isPublicPage = location.pathname === ROUTES.login || location.pathname === ROUTES.futureGoals
  const isFutureGoalsPage = location.pathname === ROUTES.futureGoals
  const isAuthenticatedArea = isAuthenticated && !isPublicPage

  const mainNavigationItems = [
    {
      key: 'races',
      label: 'Races',
      to: ROUTES.races,
      icon: faFlagCheckered,
      isActive: location.pathname === ROUTES.races || location.pathname === ROUTES.home,
    },
    {
      key: 'best-efforts',
      label: 'Best Efforts',
      to: ROUTES.bestEfforts,
      icon: faRankingStar,
      isActive: location.pathname === ROUTES.bestEfforts,
    },
  ]

  const utilityItems = [
    {
      key: 'profile',
      label: 'Profile',
      to: ROUTES.profile,
      icon: faUser,
      isActive: location.pathname === ROUTES.profile,
    },
    {
      key: 'settings',
      label: 'Settings',
      to: ROUTES.settings,
      icon: faGear,
      isActive: location.pathname === ROUTES.settings,
    },
  ]

  if (isAuthenticatedArea) {
    return (
      <Layout className={`${styles.appShell} ${styles.authShell}`}>
        <aside className={styles.sidebar}>
          <NavLink to={ROUTES.races} className={styles.logoLink} aria-label="Open RITMA Races">
            <img src="/images/ritma-logo.png" alt="RITMA RUNNERS" className={styles.logo} />
          </NavLink>

          <nav className={styles.navSection} aria-label="Main navigation">
            {mainNavigationItems.map((item) => (
              <NavLink
                key={item.key}
                to={item.to}
                className={item.isActive ? `${styles.navItem} ${styles.navItemActive}` : styles.navItem}
              >
                <FontAwesomeIcon icon={item.icon} className={styles.navIcon} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className={styles.sidebarFooter}>
            <div className={styles.utilityRow} aria-label="Account actions">
              {utilityItems.map((item) => (
                <NavLink
                  key={item.key}
                  to={item.to}
                  className={item.isActive ? `${styles.utilityButton} ${styles.utilityButtonActive}` : styles.utilityButton}
                  aria-label={item.label}
                  title={item.label}
                >
                  <FontAwesomeIcon icon={item.icon} />
                </NavLink>
              ))}
              <Button
                type="text"
                className={styles.utilityButton}
                aria-label="Logout"
                title="Logout"
                onClick={logout}
              >
                <FontAwesomeIcon icon={faRightFromBracket} />
              </Button>
            </div>

            <p className={styles.userEmail}>{user?.email}</p>
          </div>
        </aside>

        <Layout className={styles.authMain}>
          <Content className={styles.authContent}>{children}</Content>
        </Layout>
      </Layout>
    )
  }

  return (
    <Layout className={isFutureGoalsPage ? `${styles.appShell} ${styles.appShellPlain}` : styles.appShell}>
      <Content
        className={
          isLoginPage || isFutureGoalsPage
            ? `${styles.appContent} ${styles.appContentAuth}`
            : styles.appContent
        }
      >
        {children}
      </Content>
    </Layout>
  )
}

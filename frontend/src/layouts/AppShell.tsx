import {
  faAngleDown,
  faAngleRight,
  faFlagCheckered,
  faHourglassHalf,
  faMap,
  faRankingStar,
  faRightFromBracket,
  faShieldHalved,
  faUsers,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Button, Layout, Popconfirm } from 'antd'
import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../features/auth'
import { ROUTES } from '../constants/routes'
import styles from './AppShell.module.css'

const { Content } = Layout

export function AppShell({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const { isAuthenticated, isAdmin, logout, user } = useAuth()
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false)
  const isLoginPage = location.pathname === ROUTES.login
  const isPublicPage = location.pathname === ROUTES.login || location.pathname === ROUTES.futureGoals
  const isFutureGoalsPage = location.pathname === ROUTES.futureGoals
  const isAuthenticatedArea = isAuthenticated && !isPublicPage
  const isInAdminArea =
    location.pathname === ROUTES.adminRitmaOverview
    || location.pathname === ROUTES.adminUserList
    || location.pathname === ROUTES.adminPendingApprovals

  useEffect(() => {
    if (isInAdminArea) {
      setIsAdminMenuOpen(true)
    }
  }, [isInAdminArea])

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

  const adminNavigationItems = [
    {
      key: 'admin-ritma-overview',
      label: 'Overview',
      to: ROUTES.adminRitmaOverview,
      isActive: location.pathname === ROUTES.adminRitmaOverview,
    },
    {
      key: 'admin-user-list',
      label: 'Users',
      to: ROUTES.adminUserList,
      isActive: location.pathname === ROUTES.adminUserList,
    },
    {
      key: 'admin-pending-approvals',
      label: 'Pending Approvals',
      to: ROUTES.adminPendingApprovals,
      isActive: location.pathname === ROUTES.adminPendingApprovals,
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
            {isAdmin ? (
              <div className={styles.adminSection}>
                <button
                  type="button"
                  className={isInAdminArea ? `${styles.navItem} ${styles.navItemActive}` : styles.navItem}
                  onClick={() => setIsAdminMenuOpen((currentValue) => !currentValue)}
                >
                  <FontAwesomeIcon icon={faShieldHalved} className={styles.navIcon} />
                  <span>Admin Area</span>
                  <span className={styles.adminToggle} aria-expanded={isAdminMenuOpen}>
                    <span>Open admin menu</span>
                    <FontAwesomeIcon icon={isAdminMenuOpen ? faAngleDown : faAngleRight} className={styles.adminToggleIcon} />
                  </span>
                </button>

                {isAdminMenuOpen ? (
                  <div className={styles.adminSubnav}>
                    {adminNavigationItems.map((item) => (
                      <NavLink
                        key={item.key}
                        to={item.to}
                        className={item.isActive ? `${styles.adminSubItem} ${styles.adminSubItemActive}` : styles.adminSubItem}
                      >
                        <FontAwesomeIcon
                          icon={
                            item.key === 'admin-ritma-overview'
                              ? faMap
                              : item.key === 'admin-user-list'
                                ? faUsers
                                : faHourglassHalf
                          }
                          className={styles.adminSubIcon}
                        />
                        <span>{item.label}</span>
                      </NavLink>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}

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
            <div className={styles.logoutWrap} aria-label="Account actions">
              <Popconfirm
                title="Logout"
                description="Are you sure you want to logout?"
                okText="Logout"
                cancelText="Cancel"
                onConfirm={logout}
              >
                <Button
                  type="primary"
                  className={styles.logoutButton}
                  icon={<FontAwesomeIcon icon={faRightFromBracket} />}
                >
                  Logout
                </Button>
              </Popconfirm>
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

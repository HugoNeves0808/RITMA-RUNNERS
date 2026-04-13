import {
  faAngleDown,
  faAngleRight,
  faFlagCheckered,
  faHourglassHalf,
  faMap,
  faCircleUser,
  faGear,
  faList,
  faRoad,
  faTrophy,
  faRankingStar,
  faRightFromBracket,
  faShoePrints,
  faShieldHalved,
  faUsers,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Button, Layout, Modal } from 'antd'
import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../features/auth'
import { ROUTES } from '../constants/routes'
import styles from './AppShell.module.css'

const { Content } = Layout

function getDocumentTitle(pathname: string) {
  if (pathname === ROUTES.login) {
    return 'RITMA - Login'
  }

  if (pathname === ROUTES.futureGoals) {
    return 'RITMA - Future Goals'
  }

  if (pathname === ROUTES.profile) {
    return 'RITMA - Profile'
  }

  if (pathname === ROUTES.settings) {
    return 'RITMA - Settings'
  }

  if (pathname === ROUTES.personalOptionRaceTypes) {
    return 'RITMA - Race Types'
  }

  if (pathname === ROUTES.personalOptionTeams) {
    return 'RITMA - Teams'
  }

  if (pathname === ROUTES.personalOptionCircuits) {
    return 'RITMA - Circuits'
  }

  if (pathname === ROUTES.personalOptionShoes) {
    return 'RITMA - Shoes'
  }

  if (pathname === ROUTES.bestEfforts) {
    return 'RITMA - Best Efforts'
  }

  if (pathname === ROUTES.podiums) {
    return 'RITMA - Podiums'
  }

  if (pathname === ROUTES.adminRitmaOverview) {
    return 'RITMA - Admin Overview'
  }

  if (pathname === ROUTES.adminUserList) {
    return 'RITMA - Users'
  }

  if (pathname === ROUTES.adminPendingApprovals || pathname === ROUTES.adminPendingAccounts) {
    return 'RITMA - Pending Approvals'
  }

  if (pathname === ROUTES.home || pathname === ROUTES.races) {
    return 'RITMA - Races'
  }

  return 'RITMA'
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const { isAuthenticated, isAdmin, logout, user } = useAuth()
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false)
  const [isPersonalOptionsMenuOpen, setIsPersonalOptionsMenuOpen] = useState(false)
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false)
  const isLoginPage = location.pathname === ROUTES.login
  const isPublicPage = location.pathname === ROUTES.login || location.pathname === ROUTES.futureGoals
  const isFutureGoalsPage = location.pathname === ROUTES.futureGoals
  const isAuthenticatedArea = isAuthenticated && !isPublicPage
  const isInAdminArea =
    location.pathname === ROUTES.adminRitmaOverview
    || location.pathname === ROUTES.adminUserList
    || location.pathname === ROUTES.adminPendingApprovals
  const isInPersonalOptionsArea =
    location.pathname === ROUTES.personalOptionRaceTypes
    || location.pathname === ROUTES.personalOptionTeams
    || location.pathname === ROUTES.personalOptionCircuits
    || location.pathname === ROUTES.personalOptionShoes

  useEffect(() => {
    if (isInAdminArea) {
      setIsAdminMenuOpen(true)
    }
  }, [isInAdminArea])

  useEffect(() => {
    if (isInPersonalOptionsArea) {
      setIsPersonalOptionsMenuOpen(true)
    }
  }, [isInPersonalOptionsArea])

  useEffect(() => {
    document.title = getDocumentTitle(location.pathname)
  }, [location.pathname])

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
    {
      key: 'podiums',
      label: 'Podiums',
      to: ROUTES.podiums,
      icon: faTrophy,
      isActive: location.pathname === ROUTES.podiums,
    },
  ]

  const personalOptionsNavigationItems = [
    {
      key: 'personal-option-race-types',
      label: 'Race Types',
      to: ROUTES.personalOptionRaceTypes,
      isActive: location.pathname === ROUTES.personalOptionRaceTypes,
      icon: faRoad,
    },
    {
      key: 'personal-option-teams',
      label: 'Teams',
      to: ROUTES.personalOptionTeams,
      isActive: location.pathname === ROUTES.personalOptionTeams,
      icon: faUsers,
    },
    {
      key: 'personal-option-circuits',
      label: 'Circuits',
      to: ROUTES.personalOptionCircuits,
      isActive: location.pathname === ROUTES.personalOptionCircuits,
      icon: faMap,
    },
    {
      key: 'personal-option-shoes',
      label: 'Shoes',
      to: ROUTES.personalOptionShoes,
      isActive: location.pathname === ROUTES.personalOptionShoes,
      icon: faShoePrints,
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
              <div className={`${styles.navGroup} ${styles.navGroupSeparated}`.trim()}>
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

            <div className={`${styles.navGroup} ${styles.navGroupSeparated}`.trim()}>
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

              <button
                type="button"
                className={isInPersonalOptionsArea ? `${styles.navItem} ${styles.navItemActive}` : styles.navItem}
                onClick={() => setIsPersonalOptionsMenuOpen((currentValue) => !currentValue)}
              >
                <FontAwesomeIcon icon={faList} className={styles.navIcon} />
                <span>Personal Options</span>
                <span className={styles.adminToggle} aria-expanded={isPersonalOptionsMenuOpen}>
                  <span>Open personal options menu</span>
                  <FontAwesomeIcon icon={isPersonalOptionsMenuOpen ? faAngleDown : faAngleRight} className={styles.adminToggleIcon} />
                </span>
              </button>

              {isPersonalOptionsMenuOpen ? (
                <div className={styles.adminSubnav}>
                  {personalOptionsNavigationItems.map((item) => (
                    <NavLink
                      key={item.key}
                      to={item.to}
                      className={item.isActive ? `${styles.adminSubItem} ${styles.adminSubItemActive}` : styles.adminSubItem}
                    >
                      <FontAwesomeIcon icon={item.icon} className={styles.adminSubIcon} />
                      <span>{item.label}</span>
                    </NavLink>
                  ))}
                </div>
              ) : null}
            </div>
          </nav>

          <div className={styles.sidebarFooter}>
            <div className={styles.accountActions} aria-label="Account actions">
              <NavLink
                to={ROUTES.profile}
                className={location.pathname === ROUTES.profile ? `${styles.accountButton} ${styles.accountButtonActive}` : styles.accountButton}
                aria-label="Profile"
                title="Profile"
              >
                <FontAwesomeIcon icon={faCircleUser} />
              </NavLink>

              <NavLink
                to={ROUTES.settings}
                className={location.pathname === ROUTES.settings ? `${styles.accountButton} ${styles.accountButtonActive}` : styles.accountButton}
                aria-label="Settings"
                title="Settings"
              >
                <FontAwesomeIcon icon={faGear} />
              </NavLink>

              <Button
                type="primary"
                className={styles.logoutButton}
                icon={<FontAwesomeIcon icon={faRightFromBracket} />}
                aria-label="Logout"
                title="Logout"
                onClick={() => setIsLogoutModalOpen(true)}
              >
              </Button>
            </div>

            <p className={styles.userEmail}>{user?.email}</p>
          </div>
        </aside>

        <Layout className={styles.authMain}>
          <Content className={styles.authContent}>{children}</Content>
        </Layout>

        <Modal
          title="Logout"
          open={isLogoutModalOpen}
          centered
          okButtonProps={{ className: styles.logoutModalConfirmButton }}
          onOk={() => {
            setIsLogoutModalOpen(false)
            logout()
          }}
          onCancel={() => setIsLogoutModalOpen(false)}
          okText="Logout"
          cancelText="Cancel"
        >
          <p>Are you sure you want to logout?</p>
        </Modal>
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

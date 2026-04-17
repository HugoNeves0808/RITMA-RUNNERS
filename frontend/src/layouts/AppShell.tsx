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
import { Button, Dropdown, Layout, Modal } from 'antd'
import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../features/auth'
import { ROUTES } from '../constants/routes'
import { useLanguage } from '../contexts/LanguageContext'
import styles from './AppShell.module.css'

const { Content } = Layout

function getDocumentTitle(pathname: string, t: (key: string) => string) {
  if (pathname === ROUTES.login) {
    return `RITMA - ${t('pages.login')}`
  }

  if (pathname === ROUTES.profile) {
    return `RITMA - ${t('pages.profile')}`
  }

  if (pathname === ROUTES.settings) {
    return `RITMA - ${t('pages.settings')}`
  }

  if (pathname === ROUTES.personalOptionRaceTypes) {
    return `RITMA - ${t('pages.raceTypes')}`
  }

  if (pathname === ROUTES.personalOptionTeams) {
    return `RITMA - ${t('pages.teams')}`
  }

  if (pathname === ROUTES.personalOptionCircuits) {
    return `RITMA - ${t('pages.circuits')}`
  }

  if (pathname === ROUTES.personalOptionShoes) {
    return `RITMA - ${t('pages.shoes')}`
  }

  if (pathname === ROUTES.bestEfforts) {
    return `RITMA - ${t('pages.bestEfforts')}`
  }

  if (pathname === ROUTES.podiums) {
    return `RITMA - ${t('pages.podiums')}`
  }

  if (pathname === ROUTES.adminRitmaOverview) {
    return `RITMA - ${t('pages.adminOverview')}`
  }

  if (pathname === ROUTES.adminUserList) {
    return `RITMA - ${t('pages.users')}`
  }

  if (pathname === ROUTES.adminPendingApprovals || pathname === ROUTES.adminPendingAccounts) {
    return `RITMA - ${t('pages.pendingApprovals')}`
  }

  if (pathname === ROUTES.races) {
    return `RITMA - ${t('pages.races')}`
  }

  return 'RITMA'
}

function getLanguageFlag(language: string) {
  if (language === 'pt') {
    return String.fromCodePoint(0x1f1f5, 0x1f1f9)
  }

  return String.fromCodePoint(0x1f1ec, 0x1f1e7)
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation()
  const { language, setSessionLanguage } = useLanguage()
  const location = useLocation()
  const { isAuthenticated, isAdmin, logout, user } = useAuth()
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false)
  const [isPersonalOptionsMenuOpen, setIsPersonalOptionsMenuOpen] = useState(false)
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false)
  const isLoginPage = location.pathname === ROUTES.login
  const isPublicPage = location.pathname === ROUTES.login
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
    document.title = getDocumentTitle(location.pathname, t)
  }, [location.pathname, t])

  const mainNavigationItems = [
    {
      key: 'races',
      label: t('navigation.races'),
      to: ROUTES.races,
      icon: faFlagCheckered,
      isActive: location.pathname === ROUTES.races,
    },
    {
      key: 'best-efforts',
      label: t('navigation.bestEfforts'),
      to: ROUTES.bestEfforts,
      icon: faRankingStar,
      isActive: location.pathname === ROUTES.bestEfforts,
    },
    {
      key: 'podiums',
      label: t('navigation.podiums'),
      to: ROUTES.podiums,
      icon: faTrophy,
      isActive: location.pathname === ROUTES.podiums,
    },
  ]

  const personalOptionsNavigationItems = [
    {
      key: 'personal-option-race-types',
      label: t('pages.raceTypes'),
      to: ROUTES.personalOptionRaceTypes,
      isActive: location.pathname === ROUTES.personalOptionRaceTypes,
      icon: faRoad,
    },
    {
      key: 'personal-option-teams',
      label: t('pages.teams'),
      to: ROUTES.personalOptionTeams,
      isActive: location.pathname === ROUTES.personalOptionTeams,
      icon: faUsers,
    },
    {
      key: 'personal-option-circuits',
      label: t('pages.circuits'),
      to: ROUTES.personalOptionCircuits,
      isActive: location.pathname === ROUTES.personalOptionCircuits,
      icon: faMap,
    },
    {
      key: 'personal-option-shoes',
      label: t('pages.shoes'),
      to: ROUTES.personalOptionShoes,
      isActive: location.pathname === ROUTES.personalOptionShoes,
      icon: faShoePrints,
    },
  ]

  const adminNavigationItems = [
    {
      key: 'admin-ritma-overview',
      label: t('navigation.overview'),
      to: ROUTES.adminRitmaOverview,
      isActive: location.pathname === ROUTES.adminRitmaOverview,
    },
    {
      key: 'admin-user-list',
      label: t('navigation.users'),
      to: ROUTES.adminUserList,
      isActive: location.pathname === ROUTES.adminUserList,
    },
    {
      key: 'admin-pending-approvals',
      label: t('navigation.pendingApprovals'),
      to: ROUTES.adminPendingApprovals,
      isActive: location.pathname === ROUTES.adminPendingApprovals,
    },
  ]

  if (isAuthenticatedArea) {
    const languageMenuItems = [
      { key: 'en', label: <span>{getLanguageFlag('en')} {t('settings.preferences.languageEnglish')}</span> },
      { key: 'pt', label: <span>{getLanguageFlag('pt')} {t('settings.preferences.languagePortuguese')}</span> },
    ] as const

    return (
      <Layout className={`${styles.appShell} ${styles.authShell}`}>
        <aside className={styles.sidebar}>
          <NavLink to={ROUTES.races} className={styles.logoLink} aria-label={t('navigation.openRaces')}>
            <img src="/images/ritma-logo.png" alt="RITMA RUNNERS" className={styles.logo} />
          </NavLink>

          <nav className={styles.navSection} aria-label={t('navigation.mainNavigation')}>
            {isAdmin ? (
              <div className={`${styles.navGroup} ${styles.navGroupSeparated}`.trim()}>
                <button
                  type="button"
                  className={isInAdminArea ? `${styles.navItem} ${styles.navItemActive}` : styles.navItem}
                  onClick={() => setIsAdminMenuOpen((currentValue) => !currentValue)}
                >
                  <FontAwesomeIcon icon={faShieldHalved} className={styles.navIcon} />
                  <span>{t('navigation.adminArea')}</span>
                  <span className={styles.adminToggle} aria-expanded={isAdminMenuOpen}>
                    <span>{t('navigation.openAdminMenu')}</span>
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
                <span>{t('navigation.personalOptions')}</span>
                <span className={styles.adminToggle} aria-expanded={isPersonalOptionsMenuOpen}>
                  <span>{t('navigation.openPersonalOptionsMenu')}</span>
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
            <div className={styles.accountActions} aria-label={t('navigation.accountActions')}>
              <NavLink
                to={ROUTES.profile}
                className={location.pathname === ROUTES.profile ? `${styles.accountButton} ${styles.accountButtonActive}` : styles.accountButton}
                aria-label={t('common.profile')}
                title={t('common.profile')}
              >
                <FontAwesomeIcon icon={faCircleUser} />
              </NavLink>

              <NavLink
                to={ROUTES.settings}
                className={location.pathname === ROUTES.settings ? `${styles.accountButton} ${styles.accountButtonActive}` : styles.accountButton}
                aria-label={t('common.settings')}
                title={t('common.settings')}
              >
                <FontAwesomeIcon icon={faGear} />
              </NavLink>

              <Dropdown
                placement="topLeft"
                menu={{
                  items: [...languageMenuItems],
                  onClick: ({ key }) => setSessionLanguage(key === 'pt' ? 'pt' : 'en'),
                }}
                trigger={['click']}
              >
                <button
                  type="button"
                  className={styles.languageButton}
                  aria-label={t('common.language')}
                  title={t('common.language')}
                >
                  <span aria-hidden="true">{getLanguageFlag(language)}</span>
                </button>
              </Dropdown>

              <Button
                type="primary"
                className={styles.logoutButton}
                icon={<FontAwesomeIcon icon={faRightFromBracket} />}
                aria-label={t('common.logout')}
                title={t('common.logout')}
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
          title={t('modals.logout.title')}
          open={isLogoutModalOpen}
          centered
          okButtonProps={{ className: styles.logoutModalConfirmButton }}
          onOk={() => {
            setIsLogoutModalOpen(false)
            logout()
          }}
          onCancel={() => setIsLogoutModalOpen(false)}
          okText={t('modals.logout.ok')}
          cancelText={t('modals.logout.cancel')}
        >
          <p>{t('modals.logout.confirm')}</p>
        </Modal>
      </Layout>
    )
  }

  return (
    <Layout className={styles.appShell}>
      <Content
        className={
          isLoginPage
            ? `${styles.appContent} ${styles.appContentAuth}`
            : styles.appContent
        }
      >
        {children}
      </Content>
    </Layout>
  )
}

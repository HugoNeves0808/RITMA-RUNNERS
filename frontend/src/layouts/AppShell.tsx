import { faRightFromBracket } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Button, Layout } from 'antd'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../features/auth'
import { ROUTES } from '../constants/routes'
import styles from './AppShell.module.css'

const { Content } = Layout

export function AppShell({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const { isAuthenticated, logout } = useAuth()
  const isLoginPage = location.pathname === ROUTES.login
  const isPublicPage = location.pathname === ROUTES.login || location.pathname === ROUTES.futureGoals

  return (
    <Layout className={styles.appShell}>
      {isAuthenticated && !isPublicPage ? (
        <div className={styles.fixedAction}>
          <Button className={styles.logoutButton} icon={<FontAwesomeIcon icon={faRightFromBracket} />} onClick={logout}>
            Sign out
          </Button>
        </div>
      ) : null}
      <Content
        className={isLoginPage
          ? `${styles.appContent} ${styles.appContentAuth}`
          : styles.appContent}
      >
        {children}
      </Content>
    </Layout>
  )
}

import { Layout } from 'antd'
import { useLocation } from 'react-router-dom'
import { ROUTES } from '../constants/routes'
import styles from './AppShell.module.css'

const { Content } = Layout

export function AppShell({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const isLoginPage = location.pathname === ROUTES.login

  return (
    <Layout className={styles.appShell}>
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

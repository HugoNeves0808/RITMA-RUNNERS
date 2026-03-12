import { Layout } from 'antd'
import { useLocation } from 'react-router-dom'
import { ROUTES } from '../constants/routes'

const { Content } = Layout

export function AppShell({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const isLoginPage = location.pathname === ROUTES.login

  return (
    <Layout className="app-shell">
      <Content className={isLoginPage ? 'app-content app-content--auth' : 'app-content'}>
        {children}
      </Content>
    </Layout>
  )
}

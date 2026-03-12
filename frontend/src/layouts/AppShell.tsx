import { Button, Layout, Menu, Space, Typography } from 'antd'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { ROUTES } from '../constants/routes'

const { Content, Header } = Layout
const { Text, Title } = Typography

export function AppShell({ children }: { children: React.ReactNode }) {
  const { isAdmin, isAuthenticated, logout, user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const navigationItems = [
    { key: ROUTES.home, label: <Link to={ROUTES.home}>Home</Link> },
    ...(isAdmin
      ? [{ key: ROUTES.adminDiagnostics, label: <Link to={ROUTES.adminDiagnostics}>Diagnostics</Link> }]
      : []),
  ]

  const handleLogout = () => {
    logout()
    navigate(ROUTES.home)
  }

  return (
    <Layout className="app-shell">
      <Header className="app-header">
        <Title level={3} className="app-brand">RITMA RUNNERS</Title>
        <Space size="large">
          <Menu mode="horizontal" selectedKeys={[location.pathname]} items={navigationItems} className="app-menu" />
          {isAuthenticated ? (
            <Space>
              <Text>{user?.email}</Text>
              <Button onClick={handleLogout}>Logout</Button>
            </Space>
          ) : (
            <Button type="primary">
              <Link to={ROUTES.login}>Login</Link>
            </Button>
          )}
        </Space>
      </Header>
      <Content className="app-content">{children}</Content>
    </Layout>
  )
}

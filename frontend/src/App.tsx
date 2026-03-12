import { Button, Layout, Menu, Space, Spin, Typography } from 'antd'
import { Link, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from './auth/AuthProvider'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AdminDiagnosticsPage } from './pages/AdminDiagnosticsPage'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import './App.css'

const { Content, Header } = Layout
const { Text, Title } = Typography

function App() {
  const { isAdmin, isAuthenticated, isLoading, logout, user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const navigationItems = [
    { key: '/', label: <Link to="/">Home</Link> },
    ...(isAdmin ? [{ key: '/admin/diagnostics', label: <Link to="/admin/diagnostics">Diagnostics</Link> }] : []),
  ]

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  if (isLoading) {
    return (
      <Layout className="app-shell">
        <Content className="app-content app-loading">
          <Spin size="large" />
        </Content>
      </Layout>
    )
  }

  return (
    <Layout className="app-shell">
      <Header className="app-header">
        <Title level={3} className="app-brand">RITMA RUNNERS</Title>
        <Space size="large">
          <Menu
            mode="horizontal"
            selectedKeys={[location.pathname]}
            items={navigationItems}
            className="app-menu"
          />
          {isAuthenticated ? (
            <Space>
              <Text>{user?.email}</Text>
              <Button onClick={handleLogout}>Logout</Button>
            </Space>
          ) : (
            <Button type="primary">
              <Link to="/login">Login</Link>
            </Button>
          )}
        </Space>
      </Header>
      <Content className="app-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute requiredRole="ADMIN" />}>
            <Route path="/admin/diagnostics" element={<AdminDiagnosticsPage />} />
          </Route>
        </Routes>
      </Content>
    </Layout>
  )
}

export default App

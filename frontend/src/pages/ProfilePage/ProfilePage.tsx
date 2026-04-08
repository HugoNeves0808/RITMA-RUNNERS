import { faGear, faUser } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Button, Card, Col, Descriptions, Row, Space, Tag, Typography } from 'antd'
import { Link } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'
import { useAuth } from '../../features/auth'
import styles from './ProfilePage.module.css'

const { Text, Title } = Typography

function formatRole(role: string | undefined) {
  if (role === 'ADMIN') {
    return 'Admin'
  }

  if (role === 'USER') {
    return 'User'
  }

  return '-'
}

export function ProfilePage() {
  const { user } = useAuth()

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Title level={1} className={styles.title}>Profile</Title>

        <Link to={ROUTES.settings}>
          <Button className={styles.settingsButton} icon={<FontAwesomeIcon icon={faGear} />}>
            Open settings
          </Button>
        </Link>
      </div>

      <Row gutter={[20, 20]}>
        <Col xs={24} xl={15}>
          <Card className={styles.card} bordered={false}>
            <Space direction="vertical" size={18} className={styles.fullWidth}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIntro}>
                  <span className={styles.sectionIcon}>
                    <FontAwesomeIcon icon={faUser} />
                  </span>
                  <Text className={styles.sectionEyebrow}>Account</Text>
                </div>
                <Title level={3} className={styles.sectionTitle}>Personal information</Title>
              </div>

              <Descriptions column={1} labelStyle={{ width: 180 }} className={styles.descriptions}>
                <Descriptions.Item label="Email">{user?.email ?? '-'}</Descriptions.Item>
                <Descriptions.Item label="Role">{formatRole(user?.role)}</Descriptions.Item>
                <Descriptions.Item label="Account status">
                  <Tag color="green" className={styles.statusTag}>Active</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Password status">
                  {user?.forcePasswordChange ? 'Password update required' : 'Password up to date'}
                </Descriptions.Item>
              </Descriptions>
            </Space>
          </Card>
        </Col>

      </Row>
    </div>
  )
}

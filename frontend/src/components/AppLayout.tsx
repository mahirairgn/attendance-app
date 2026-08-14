import { Avatar, Dropdown, Layout, Menu, Space, Typography } from 'antd';
import {
  ClockCircleFilled,
  DownOutlined,
  LogoutOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';

const { Header, Content } = Layout;
const { Text } = Typography;

/** Baca email dari payload JWT — cuma buat ditampilkan, bukan buat otorisasi. */
function getEmailFromToken(): string {
  const token = localStorage.getItem('access_token');
  if (!token) return '';

  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64)).email ?? '';
  } catch {
    return '';
  }
}

function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = getEmailFromToken();

  function handleLogout() {
    localStorage.removeItem('access_token');
    navigate('/login', { replace: true });
  }

  return (
    <Layout style={{ minHeight: '100%', background: '#f7f8fa' }}>
      <Header className="app-header">
        <Space size={10} className="app-brand">
          <ClockCircleFilled style={{ color: '#1677ff', fontSize: 20 }} />
          <span>Attendance</span>
        </Space>

        <Menu
          mode="horizontal"
          selectedKeys={[location.pathname]}
          className="app-nav"
          items={[
            {
              key: '/dashboard',
              label: <Link to="/dashboard">Absensi Hari Ini</Link>,
            },
          ]}
        />

        <Dropdown
          trigger={['click']}
          menu={{
            items: [
              {
                key: 'email',
                label: <Text type="secondary">{email}</Text>,
                disabled: true,
              },
              { type: 'divider' },
              {
                key: 'logout',
                label: 'Logout',
                icon: <LogoutOutlined />,
                danger: true,
                onClick: handleLogout,
              },
            ],
          }}
        >
          <Space className="app-user" size={8}>
            <Avatar size={32} icon={<UserOutlined />} />
            <Text>{email.split('@')[0]}</Text>
            <DownOutlined style={{ fontSize: 10, color: '#8c8c8c' }} />
          </Space>
        </Dropdown>
      </Header>

      <Content>
        <div className="app-container">
          <Outlet />
        </div>
      </Content>
    </Layout>
  );
}

export default AppLayout;

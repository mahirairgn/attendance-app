import { useState } from 'react';
import { Avatar, Button, Dropdown, Form, Input, Layout, Menu, Modal, Space, Typography, message } from 'antd';
import {
  ClockCircleFilled,
  DownOutlined,
  KeyOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { decodeToken } from '../lib/jwt';

const { Header, Content } = Layout;
const { Text } = Typography;
const API_URL = 'http://localhost:3000';

interface ChangePasswordValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const payload = decodeToken();
  const email = payload?.email ?? '';
  const name = email.split('@')[0];

  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordForm] = Form.useForm<ChangePasswordValues>();

  async function handleChangePassword() {
    try {
      const values = await passwordForm.validateFields();
      setChangingPassword(true);

      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Gagal mengubah password');
      }

      message.success('Password berhasil diubah');
      setPasswordModalOpen(false);
      passwordForm.resetFields();
    } catch (err) {
      if (err instanceof Error) message.error(err.message);
    } finally {
      setChangingPassword(false);
    }
  }

  const menuItems = [
    { key: '/home', label: <Link to="/home">Home</Link> },
    { key: '/history', label: <Link to="/history">History</Link> },
    ...(payload?.role === 'admin'
      ? [
        { key: '/report', label: <Link to="/report">Report</Link> },
        { key: '/employees', label: <Link to="/employees">Employee</Link> },
      ]
      : []),
  ];

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
          items={menuItems}
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
                key: 'password',
                icon: <KeyOutlined />,
                label: <Text>Change Password</Text>,
                onClick: () => setPasswordModalOpen(true),
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
              <Avatar size={32} className="bg-blue-500 font-semibold">
                {name.charAt(0).toUpperCase()}
              </Avatar>
            <Text>
              {(() => {
                return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
              })()}
            </Text>
            <DownOutlined style={{ fontSize: 10, color: '#8c8c8c' }} />
          </Space>
        </Dropdown>
      </Header>

      <Content>
        <div className="app-container">
          <Outlet />
        </div>
      </Content>

      <Modal
        title="Reset Password"
        open={passwordModalOpen}
        onOk={handleChangePassword}
        onCancel={() => {
          setPasswordModalOpen(false);
          passwordForm.resetFields();
        }}
        confirmLoading={changingPassword}
        okText="Simpan"
        cancelText="Batal"
      >
        <Form form={passwordForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="currentPassword"
            label="Current Password"
            rules={[{ required: true, message: 'Password saat ini wajib diisi' }]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item
            name="newPassword"
            label="New Password"
            rules={[
              { required: true, message: 'Password baru wajib diisi' },
              { min: 8, message: 'Password baru minimal 8 karakter' },
            ]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Confirm New Password"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: 'Konfirmasi password baru wajib diisi' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Konfirmasi password tidak cocok'));
                },
              }),
            ]}
          >
            <Input.Password />
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
}

export default AppLayout;

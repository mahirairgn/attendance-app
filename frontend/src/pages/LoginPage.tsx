import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Button, Card, Typography, message } from 'antd';

const { Title } = Typography;
const API_URL = 'http://localhost:3000';

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Login gagal');
      }

      localStorage.setItem('access_token', data.access_token);
      navigate('/home', { replace: true });
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Login gagal');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <Card style={{ width: 360 }}>
        <form onSubmit={handleSubmit}>
          <Title level={3} style={{ textAlign: 'center', marginTop: 0 }}>
            Login
          </Title>

          <div>
            <label className="login-field" htmlFor="email">
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="login-field" htmlFor="password">
              Password
            </label>
            <Input.Password
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button type="primary" htmlType="submit" loading={loading} block>
            Login
          </Button>
        </form>
      </Card>
    </div>
  );
}

export default LoginPage;

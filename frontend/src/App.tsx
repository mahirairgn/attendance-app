import { useState } from 'react';
import LoginPage from './pages/LoginPage';
import './App.css';

function App() {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem('access_token'),
  );

  function handleLoginSuccess(accessToken: string) {
    localStorage.setItem('access_token', accessToken);
    setToken(accessToken);
  }

  if (!token) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Kamu berhasil login.</p>
    </div>
  );
}

export default App;

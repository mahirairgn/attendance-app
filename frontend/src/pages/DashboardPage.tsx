import { useNavigate } from 'react-router-dom';

function DashboardPage() {
  const navigate = useNavigate();

  function handleLogout() {
    localStorage.removeItem('access_token');
    navigate('/login', { replace: true });
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Kamu berhasil login.</p>
      <button type="button" onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
}

export default DashboardPage;

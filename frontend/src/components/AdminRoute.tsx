import { Navigate, Outlet } from 'react-router-dom';
import { decodeToken } from '../lib/jwt';

function AdminRoute() {
  const payload = decodeToken();

  if (payload?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

export default AdminRoute;
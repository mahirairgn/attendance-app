import { Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import EmployeePage from './pages/EmployeePage';
import HistoryPage from './pages/HistoryPage';
import ReportPage from './pages/ReportPage';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';
import './App.css';
import AdminRoute from './components/AdminRoute';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/home" element={<HomePage />} />
          <Route path="/history" element={<HistoryPage />} />

          <Route element={<AdminRoute />}>
            <Route path="/employees" element={<EmployeePage />} />
            <Route path="/report" element={<ReportPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}

export default App;

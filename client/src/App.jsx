import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/Login';
import AlliancesPage from './pages/AlliancesList';
import AllianceFormPage from './pages/AllianceForm';
import AllianceDetailPage from './pages/AllianceDetail';
import DocumentTypesPage from './pages/DocumentTypes';
import UsersPage from './pages/Users';
import AuthGuard from './components/AuthGuard';

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-cvm-blue border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/alliances" /> : <LoginPage />} />
      <Route
        path="/"
        element={
          <AuthGuard>
            <Layout />
          </AuthGuard>
        }
      >
        <Route index element={<Navigate to="/alliances" replace />} />
        <Route path="alliances" element={<AlliancesPage />} />
        <Route path="alliances/new" element={<AllianceFormPage />} />
        <Route path="alliances/:id" element={<AllianceDetailPage />} />
        <Route path="alliances/:id/edit" element={<AllianceFormPage />} />
        <Route path="document-types" element={<DocumentTypesPage />} />
        <Route path="users" element={<UsersPage />} />
      </Route>
    </Routes>
  );
}

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import AuthLayout from '@/layouts/AuthLayout';
import MainLayout from '@/layouts/MainLayout';
import LoginPage from '@/pages/auth/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import UnauthorizedPage from '@/pages/UnauthorizedPage';
import '@/styles/auth.css';

import SettingsPage from '@/pages/SettingsPage';
import SiswaPage from '@/pages/SiswaPage';
import SekolahPage from '@/pages/SekolahPage';
import UsersPage from '@/pages/UsersPage';
import KelasPage from '@/pages/KelasPage';
import TahunAjaranPage from '@/pages/TahunAjaranPage';
import SemesterPage from '@/pages/SemesterPage';
import GuruPage from '@/pages/GuruPage';
import MapelPage from '@/pages/MapelPage';
import JadwalPage from '@/pages/Pembelajaran';
import AbsensiPage from '@/pages/AbsensiPage';
import PembelajaranPage from '@/pages/Pembelajaran';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Auth routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
          </Route>

          {/* Protected routes wrapped in MainLayout */}
          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/sekolah" element={<SekolahPage />} />
            <Route path="/siswa" element={<SiswaPage />} />
            <Route path="/guru" element={<GuruPage />} />
            <Route path="/mapel" element={<MapelPage />} />
            <Route path="/pembelajaran" element={<PembelajaranPage />} />
            <Route path="/absensi" element={<AbsensiPage />} />
            <Route path="/kelas" element={<KelasPage />} />
            <Route path="/tahun-ajaran" element={<TahunAjaranPage />} />
            <Route path="/semester" element={<SemesterPage />} />
            <Route path="/users" element={<UsersPage />} />
            {/* Add more protected routes here */}
          </Route>

          {/* Unauthorized */}
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Redirect root to login */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

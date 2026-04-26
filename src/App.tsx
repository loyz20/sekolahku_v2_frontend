import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import AuthLayout from '@/layouts/AuthLayout';
import MainLayout from '@/layouts/MainLayout';
import LoginPage from '@/pages/auth/LoginPage';
import DashboardPage from '@/pages/core/DashboardPage';
import UnauthorizedPage from '@/pages/core/UnauthorizedPage';
import '@/styles/auth.css';

import SettingsPage from '@/pages/admin/SettingsPage';
import SiswaPage from '@/pages/kesiswaan/SiswaPage';
import SiswaDetailPage from '@/pages/kesiswaan/SiswaDetailPage';
import SekolahPage from '@/pages/admin/SekolahPage';
import UsersPage from '@/pages/admin/UsersPage';
import KelasPage from '@/pages/sarana/KelasPage';
import KelasDetailPage from '@/pages/sarana/KelasDetailPage';
import TahunAjaranPage from '@/pages/admin/TahunAjaranPage';
import SemesterPage from '@/pages/admin/SemesterPage';
import SumatifPage from '@/pages/akademik/SumatifPage';
import GuruPage from '@/pages/sdm/GuruPage';
import GuruDetailPage from '@/pages/sdm/GuruDetailPage';
import MapelPage from '@/pages/akademik/MapelPage';
import JadwalPage from '@/pages/akademik/JadwalPage';
import AbsensiPage from '@/pages/presensi/AbsensiPage';
import PembelajaranPage from '@/pages/akademik/Pembelajaran';

import ActivityLogPage from '@/pages/admin/ActivityLogPage';
import JurnalPage from '@/pages/jurnal/JurnalPage';
import JurnalRiwayatPage from '@/pages/jurnal/JurnalRiwayatPage';
import PelanggaranMasterPage from '@/pages/kesiswaan/PelanggaranMasterPage';
import PelanggaranSiswaPage from '@/pages/kesiswaan/PelanggaranSiswaPage';
import BimbinganKonselingPage from '@/pages/kesiswaan/BimbinganKonselingPage';
import PrestasiSiswaPage from '@/pages/kesiswaan/PrestasiSiswaPage';
import KategoriPenilaianPage from '@/pages/akademik/KategoriPenilaianPage';
import PengumumanPage from '@/pages/admin/PengumumanPage';
import NotificationPage from '@/pages/core/NotificationPage';
import WaliDashboardPage from '@/pages/wali/WaliDashboardPage';
import WaliSiswaPage from '@/pages/wali/WaliSiswaPage';
import WaliPresensiPage from '@/pages/wali/WaliPresensiPage';

import { NotificationProvider } from '@/contexts/NotificationContext';
import { Toaster } from 'sonner';

function App() {
  return (
    <BrowserRouter>
      <Toaster 
        position="top-right"
        expand={false}
        richColors
        closeButton
        theme="dark"
        toastOptions={{
          style: {
            background: 'rgba(24, 24, 27, 0.8)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            color: '#fff',
            fontFamily: 'Inter, sans-serif',
          },
        }}
      />
      <AuthProvider>
        <NotificationProvider>
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
              <Route path="/siswa/:id" element={<SiswaDetailPage />} />
              <Route path="/guru" element={<GuruPage />} />
              <Route path="/guru/:id" element={<GuruDetailPage />} />
              <Route path="/mapel" element={<MapelPage />} />
              <Route path="/pembelajaran" element={<PembelajaranPage />} />
              <Route path="/sumatif" element={<SumatifPage />} />
              <Route path="/absensi" element={<AbsensiPage />} />
              <Route path="/kelas" element={<KelasPage />} />
              <Route path="/kelas/:id" element={<KelasDetailPage />} />
              <Route path="/tahun-ajaran" element={<TahunAjaranPage />} />
              <Route path="/semester" element={<SemesterPage />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/jadwal" element={<JadwalPage />} />
              <Route path="/activity-log" element={<ActivityLogPage />} />
              <Route path="/jurnal" element={<JurnalPage />} />
              <Route path="/jurnal-riwayat" element={<JurnalRiwayatPage />} />
              <Route path="/pelanggaran-master" element={<PelanggaranMasterPage />} />
              <Route path="/pelanggaran-siswa" element={<PelanggaranSiswaPage />} />
              <Route path="/prestasi-siswa" element={<PrestasiSiswaPage />} />
              <Route path="/bimbingan-konseling" element={<BimbinganKonselingPage />} />
              <Route path="/penilaian-kategori" element={<KategoriPenilaianPage />} />
              <Route path="/pengumuman" element={<PengumumanPage />} />
              <Route path="/notifications" element={<NotificationPage />} />
              <Route path="/wali-kelas/dashboard" element={<WaliDashboardPage />} />
              <Route path="/wali-kelas/siswa" element={<WaliSiswaPage />} />
              <Route path="/wali-kelas/presensi" element={<WaliPresensiPage />} />
              {/* Add more protected routes here */}
            </Route>

            {/* Unauthorized */}
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            {/* Redirect root to login */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

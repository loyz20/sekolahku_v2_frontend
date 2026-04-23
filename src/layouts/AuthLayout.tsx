import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function AuthLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="auth-layout">
      {/* Animated background */}
      <div className="auth-bg">
        <div className="auth-bg-gradient" />
        <div className="auth-bg-grid" />
        <div className="auth-bg-glow auth-bg-glow-1" />
        <div className="auth-bg-glow auth-bg-glow-2" />
        <div className="auth-bg-glow auth-bg-glow-3" />
      </div>

      {/* Main content */}
      <div className="auth-container">
        {/* Left panel — branding */}
        <div className="auth-branding">
          <div className="auth-branding-content">
            <div className="auth-logo">
              <div className="auth-logo-icon">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 2L3 9V23L16 30L29 23V9L16 2Z" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                  <path d="M16 2L29 9L16 16L3 9L16 2Z" fill="currentColor" opacity="0.3" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                  <path d="M16 16V30" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M10 12.5V21L16 24.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="16" cy="9" r="2" fill="currentColor"/>
                </svg>
              </div>
              <span className="auth-logo-text">Sekolahku</span>
            </div>

            <div className="auth-branding-hero">
              <h1 className="auth-branding-title">
                Sistem Informasi<br />
                <span>Manajemen Sekolah</span>
              </h1>
              <p className="auth-branding-desc">
                Platform digital terpadu untuk mengelola data akademik, 
                kehadiran, dan administrasi sekolah secara efisien.
              </p>
            </div>

            <div className="auth-branding-features">
              <div className="auth-feature">
                <div className="auth-feature-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </div>
                <div>
                  <h3>Manajemen Siswa & Guru</h3>
                  <p>Data lengkap peserta didik dan tenaga pendidik</p>
                </div>
              </div>
              <div className="auth-feature">
                <div className="auth-feature-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                    <line x1="8" y1="7" x2="16" y2="7"/>
                    <line x1="8" y1="11" x2="13" y2="11"/>
                  </svg>
                </div>
                <div>
                  <h3>Akademik & Penilaian</h3>
                  <p>Kurikulum, jadwal, dan nilai terintegrasi</p>
                </div>
              </div>
              <div className="auth-feature">
                <div className="auth-feature-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                    <path d="M8 14h.01"/>
                    <path d="M12 14h.01"/>
                    <path d="M16 14h.01"/>
                    <path d="M8 18h.01"/>
                    <path d="M12 18h.01"/>
                  </svg>
                </div>
                <div>
                  <h3>Absensi Real-time</h3>
                  <p>Pencatatan kehadiran harian yang akurat</p>
                </div>
              </div>
            </div>

            <div className="auth-branding-footer">
              <p>© 2026 Sekolahku. Hak cipta dilindungi.</p>
            </div>
          </div>
        </div>

        {/* Right panel — form */}
        <div className="auth-form-panel">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

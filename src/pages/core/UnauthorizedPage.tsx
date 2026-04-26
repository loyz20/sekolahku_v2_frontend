import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function UnauthorizedPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <div style={{
      minHeight: '100vh',
      background: 'oklch(0.13 0.02 260)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        maxWidth: '420px',
        width: '100%',
        padding: '40px',
        borderRadius: '20px',
        background: 'oklch(0.16 0.01 260 / 0.8)',
        border: '1px solid oklch(1 0 0 / 0.08)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 8px 40px oklch(0 0 0 / 0.4)',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px',
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '16px',
          background: 'oklch(0.35 0.12 45 / 0.2)',
          border: '1px solid oklch(0.5 0.15 45 / 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'oklch(0.7 0.15 45)',
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>

        <div>
          <h1 style={{
            fontSize: '1.4rem',
            fontWeight: 800,
            color: 'oklch(0.95 0.01 260)',
            letterSpacing: '-0.02em',
            marginBottom: '8px',
          }}>
            Akses Ditolak
          </h1>
          <p style={{
            fontSize: '0.88rem',
            color: 'oklch(0.55 0.02 260)',
            lineHeight: 1.5,
          }}>
            Anda tidak memiliki izin untuk mengakses halaman ini.
          </p>
        </div>

        <button
          onClick={() => navigate(isAuthenticated ? '/dashboard' : '/login', { replace: true })}
          style={{
            width: '100%',
            height: '46px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, oklch(0.5 0.18 260), oklch(0.45 0.15 240))',
            border: 'none',
            color: 'oklch(0.98 0.01 260)',
            fontSize: '0.9rem',
            fontWeight: 600,
            fontFamily: 'inherit',
            cursor: 'pointer',
          }}
        >
          {isAuthenticated ? 'Kembali ke Dashboard' : 'Kembali ke Login'}
        </button>
      </div>
    </div>
  );
}

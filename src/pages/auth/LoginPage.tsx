import { useState, useCallback, type FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { loginSchema, validateForm, type LoginFormData } from '@/lib/validations';

export default function LoginPage() {
  const { login, error, clearError, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({ username: false, password: false });
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  const validateField = (field: keyof LoginFormData, value: string) => {
    const result = validateForm(loginSchema, { ...formData, [field]: value });
    if (!result.success && result.errors) {
      setValidationErrors((prev) => ({
        ...prev,
        [field]: result.errors![field] || [],
      }));
    } else {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    if (touched[name as keyof typeof touched]) {
      validateField(name as keyof LoginFormData, value);
    }
    
    if (error) clearError();
  };

  const handleBlur = (field: keyof LoginFormData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field, formData[field]);
  };

  const isFormValid = (() => {
    const result = validateForm(loginSchema, formData);
    return result.success;
  })();

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      
      // Mark all fields as touched
      setTouched({ username: true, password: true });

      // Validate form
      const result = validateForm(loginSchema, formData);
      if (!result.success) {
        setValidationErrors(result.errors || {});
        return;
      }

      try {
        await login(formData.username, formData.password);
        navigate(from, { replace: true });
      } catch {
        // error is handled in context
      }
    },
    [formData, login, navigate, from]
  );

  const getFieldError = (field: keyof LoginFormData): string | undefined => {
    return validationErrors[field]?.[0];
  };

  return (
    <div className="auth-form-wrapper">
      <div className="auth-form-header">
        {/* Mobile-only logo */}
        <div className="auth-form-mobile-logo">
          <div className="auth-logo-icon">
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 2L3 9V23L16 30L29 23V9L16 2Z" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M16 2L29 9L16 16L3 9L16 2Z" fill="currentColor" opacity="0.3" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M16 16V30" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M10 12.5V21L16 24.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="16" cy="9" r="2" fill="currentColor"/>
            </svg>
          </div>
          <span className="auth-logo-text">Sekolahku</span>
        </div>

        <h2 className="auth-form-title">Selamat Datang</h2>
        <p className="auth-form-subtitle">
          Masuk ke akun Anda untuk mengakses sistem
        </p>
      </div>

      {/* Error alert */}
      {error && (
        <div className="auth-alert auth-alert-error" role="alert">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>{error}</span>
          <button onClick={clearError} className="auth-alert-dismiss" aria-label="Tutup">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        {/* Username field */}
        <div className={`auth-field ${getFieldError('username') ? 'auth-field-error' : ''}`}>
          <label htmlFor="login-username" className="auth-label">
            Username
          </label>
          <div className="auth-input-wrapper">
            <span className="auth-input-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </span>
            <input
              id="login-username"
              type="text"
              name="username"
              className="auth-input"
              placeholder="Masukkan username"
              value={formData.username}
              onChange={handleChange}
              onBlur={() => handleBlur('username')}
              autoComplete="username"
              autoFocus
              disabled={isLoading}
            />
          </div>
          {getFieldError('username') && (
            <p className="auth-field-message">{getFieldError('username')}</p>
          )}
        </div>

        {/* Password field */}
        <div className={`auth-field ${getFieldError('password') ? 'auth-field-error' : ''}`}>
          <label htmlFor="login-password" className="auth-label">
            Password
          </label>
          <div className="auth-input-wrapper">
            <span className="auth-input-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </span>
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              className="auth-input"
              placeholder="Masukkan password"
              value={formData.password}
              onChange={handleChange}
              onBlur={() => handleBlur('password')}
              autoComplete="current-password"
              disabled={isLoading}
            />
            <button
              type="button"
              className="auth-input-toggle"
              onClick={() => setShowPassword((s) => !s)}
              tabIndex={-1}
              aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
            >
              {showPassword ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                  <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>
          {getFieldError('password') && (
            <p className="auth-field-message">{getFieldError('password')}</p>
          )}
        </div>

        {/* Submit button */}
        <button
          type="submit"
          className="auth-submit"
          disabled={isLoading || !isFormValid}
          id="login-submit"
        >
          {isLoading ? (
            <>
              <svg className="auth-spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="31.42 31.42" strokeDashoffset="10">
                  <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite"/>
                </circle>
              </svg>
              <span>Memproses...</span>
            </>
          ) : (
            <>
              <span>Masuk</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
            </>
          )}
        </button>
      </form>

      <div className="auth-form-footer">
        <p>Lupa password? Hubungi administrator sekolah.</p>
      </div>
    </div>
  );
}

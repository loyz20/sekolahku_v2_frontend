import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { api, type ApiError } from '@/lib/api';

interface User {
  id: string;
  username: string;
  role: string;
  nama?: string;
  sekolah_id?: string;
  ref_id?: string;
  email?: string;
  phone?: string;
  is_wali_kelas?: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
  clearError: () => void;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Restore user from localStorage on mount
  // Tokens are automatically sent via httpOnly cookies, so we only need to restore user info
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch {
      // Clear invalid user data
      localStorage.removeItem('user');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    setError(null);
    setIsLoading(true);

    try {
      const response = await api.post<{
        data: {
          user: User;
        };
      }>('/auth/login', { username, password });

      const userData = response.data.user;

      // Store only user info in localStorage (tokens are in httpOnly cookies)
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Terjadi kesalahan saat login');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      // Tokens are in httpOnly cookies, server will clear them
      await api.post('/auth/logout', {});
    } catch {
      // Ignore logout errors
    } finally {
      localStorage.removeItem('user');
      setUser(null);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        error,
        clearError,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

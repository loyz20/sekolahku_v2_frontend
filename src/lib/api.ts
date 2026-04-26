const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

interface ApiError {
  status: number;
  message: string;
  code?: string;
}

class ApiClient {
  private baseUrl: string;
  private csrfToken: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  clearTokens() {
    // Tokens are now stored in httpOnly cookies on the server side
    // No need to clear localStorage
    localStorage.removeItem('user');
    this.csrfToken = null;
  }

  /**
   * Fetch CSRF token from the server
   * Should be called before any state-changing operations
   */
  async fetchCsrfToken(): Promise<string> {
    if (this.csrfToken) {
      return this.csrfToken;
    }

    try {
      const response = await fetch(`${this.baseUrl}/auth/csrf-token`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch CSRF token');
      }

      const data = await response.json();
      this.csrfToken = data.data.csrf_token;
      return this.csrfToken || '';
    } catch (error) {
      console.error('Error fetching CSRF token:', error);
      throw error;
    }
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      const error: ApiError = {
        status: response.status,
        message: body.message || 'Terjadi kesalahan pada server',
        code: body.code,
      };
      throw error;
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  private async refreshAccessToken(): Promise<boolean> {
    try {
      // Get fresh CSRF token for refresh request
      const csrfToken = await this.fetchCsrfToken();
      
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        credentials: 'include', // Include httpOnly cookies
      });

      if (!response.ok) return false;

      // Tokens are automatically set as httpOnly cookies by the server
      // Invalidate cached CSRF token to force refresh on next request
      this.csrfToken = null;
      return true;
    } catch {
      return false;
    }
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retry = true
  ): Promise<T> {
    const isFormData = options.body instanceof FormData;
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    // Only set Content-Type if it's not FormData (fetch handles FormData headers automatically)
    if (!isFormData && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    // Add CSRF token for state-changing requests
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method?.toUpperCase() || '')) {
      try {
        const csrfToken = await this.fetchCsrfToken();
        headers['X-CSRF-Token'] = csrfToken;
      } catch (error) {
        console.error('Failed to get CSRF token:', error);
        throw error;
      }
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include', // Automatically include httpOnly cookies
    });

    // If 401 and we haven't retried yet, try to refresh
    if (response.status === 401 && retry) {
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        return this.request<T>(endpoint, options, false);
      }
      // Refresh failed — clear user and redirect to login
      this.clearTokens();
      window.location.href = '/login';
    }

    // If 403 Forbidden and it's a CSRF error, invalidate token and retry
    if (response.status === 403 && retry && ['POST', 'PUT', 'DELETE'].includes(options.method?.toUpperCase() || '')) {
      const body = await response.json().catch(() => ({}));
      if (body.code === 'FORBIDDEN') { // CSRF validation failed
        this.csrfToken = null; // Invalidate cached token
        return this.request<T>(endpoint, options, false);
      }
    }

    return this.handleResponse<T>(response);
  }

  async post<T>(endpoint: string, body: unknown, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }

  async get<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async put<T>(endpoint: string, body: unknown, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }

  async patch<T>(endpoint: string, body?: unknown, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body instanceof FormData ? body : (body ? JSON.stringify(body) : undefined),
    });
  }

  async delete<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const api = new ApiClient(API_BASE_URL);
export type { ApiError };

/**
 * DealMind Centralized API Client
 * Connects to PostgreSQL Backend API with automatic JWT token management
 */

const API_BASE = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/$/, '')
  : '';

export const TOKEN_KEY = 'dealmind_token';

export interface ApiError extends Error {
  status?: number;
  data?: any;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  const token = localStorage.getItem(TOKEN_KEY);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // If token was invalid/expired, clear stored session token
    if (token) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem('dealmind_user');
    }
  }

  let data: any = null;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const error: ApiError = new Error(
      (data && typeof data === 'object' && data.error) ||
      `Request failed with status ${response.status}`
    );
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data as T;
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint, { method: 'GET' }),
  post: <T>(endpoint: string, body?: any) =>
    request<T>(endpoint, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  put: <T>(endpoint: string, body?: any) =>
    request<T>(endpoint, {
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),

  checkHealth: async () => {
    try {
      const res = await fetch(`${API_BASE}/api/health`);
      if (!res.ok) return { online: false, connected: false, error: 'Server returned error' };
      const data = await res.json();
      return {
        online: true,
        connected: data.database?.connected || false,
        error: data.database?.error || null,
        preview: data.database?.connectionStringPreview || '',
      };
    } catch (err: any) {
      return { online: false, connected: false, error: err.message };
    }
  },
};

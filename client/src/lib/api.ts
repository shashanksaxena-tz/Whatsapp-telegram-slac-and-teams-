import { useAuthStore } from '../stores';

const API_BASE = '/api';

class ApiClient {
  private getHeaders(): HeadersInit {
    const token = useAuthStore.getState().token;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  async get<T>(path: string): Promise<T> {
    const response = await fetch(`${API_BASE}${path}`, {
      headers: this.getHeaders(),
    });
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return response.json();
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    const response = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `API error: ${response.status}`);
    }
    return response.json();
  }

  async put<T>(path: string, body?: unknown): Promise<T> {
    const response = await fetch(`${API_BASE}${path}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return response.json();
  }

  async delete<T>(path: string): Promise<T> {
    const response = await fetch(`${API_BASE}${path}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return response.json();
  }
}

export const api = new ApiClient();

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ token: string; user: any }>('/auth/login', { email, password }),
  register: (email: string, password: string, name: string, role?: string) =>
    api.post<{ token: string; user: any }>('/auth/register', { email, password, name, role }),
  me: () => api.get<any>('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

// Conversations API
export const conversationsApi = {
  list: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<any[]>(`/conversations${query}`);
  },
  get: (id: string) => api.get<any>(`/conversations/${id}`),
  assign: (id: string, agentId: string) =>
    api.post(`/conversations/${id}/assign`, { agentId }),
  resolve: (id: string) => api.post(`/conversations/${id}/resolve`),
  reply: (id: string, content: string) =>
    api.post(`/conversations/${id}/reply`, { content }),
};

// Escalations API
export const escalationsApi = {
  list: () => api.get<any[]>('/escalations'),
  assign: (id: string, agentId: string) =>
    api.post(`/escalations/${id}/assign`, { agentId }),
  resolve: (id: string) => api.post(`/escalations/${id}/resolve`),
};

// Customers API
export const customersApi = {
  list: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<any[]>(`/customers${query}`);
  },
  get: (id: string) => api.get<any>(`/customers/${id}`),
  merge: (id: string, targetId: string) =>
    api.post(`/customers/${id}/merge`, { targetId }),
};

// Analytics API
export const analyticsApi = {
  summary: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<any>(`/analytics/summary${query}`);
  },
  sentiment: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<any>(`/analytics/sentiment${query}`);
  },
  agents: () => api.get<any[]>('/analytics/agents'),
};

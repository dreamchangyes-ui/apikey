import {
  DashboardMetrics,
  ChartDataPoint,
  ProviderUsageItem,
  ModelUsageItem,
  ProviderItem,
  ApiKeyItem,
  ProviderModelItem,
  ProviderPoolGroup,
  ClientApiKeyItem,
  UsageLogItem,
  ErrorLogItem,
  HealthCheckItem,
  SystemSettingsState,
  UserProfile,
} from '../types';

export const api = {
  // Auth
  async login(email: string, password: string): Promise<{ user: UserProfile; token: string }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Authentication failed');
    }
    return res.json();
  },

  async getCurrentUser(): Promise<UserProfile> {
    const res = await fetch('/api/auth/me');
    if (!res.ok) throw new Error('Failed to fetch current user');
    const data = await res.json();
    return data.user;
  },

  // Dashboard Stats
  async getDashboardStats(): Promise<{
    metrics: DashboardMetrics;
    charts: {
      requestsOverTime: ChartDataPoint[];
      providerUsage: ProviderUsageItem[];
      modelUsage: ModelUsageItem[];
      usagePredictions: import('../types').PredictionDataPoint[];
    };
  }> {
    const res = await fetch('/api/dashboard/stats');
    if (!res.ok) throw new Error('Failed to load dashboard statistics');
    return res.json();
  },

  // Providers
  async getProviders(): Promise<ProviderItem[]> {
    const res = await fetch('/api/providers');
    if (!res.ok) throw new Error('Failed to load providers');
    return res.json();
  },

  async createProvider(data: Partial<ProviderItem>): Promise<ProviderItem> {
    const res = await fetch('/api/providers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create provider');
    }
    return res.json();
  },

  async updateProvider(id: string, data: Partial<ProviderItem>): Promise<ProviderItem> {
    const res = await fetch(`/api/providers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update provider');
    return res.json();
  },

  async deleteProvider(id: string): Promise<void> {
    const res = await fetch(`/api/providers/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete provider');
  },

  async testProvider(id: string): Promise<{ success: boolean; latencyMs: number; message: string }> {
    const res = await fetch(`/api/providers/${id}/test`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to test provider connection');
    return res.json();
  },

  // API Keys
  async getApiKeys(): Promise<ApiKeyItem[]> {
    const res = await fetch('/api/api-keys');
    if (!res.ok) throw new Error('Failed to load API keys');
    return res.json();
  },

  async createApiKey(data: { providerId: string; label: string; rawKey: string; priority?: number; quotaTotal?: number }): Promise<ApiKeyItem> {
    const res = await fetch('/api/api-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to register API key');
    }
    return res.json();
  },

  async updateApiKey(id: string, data: Partial<ApiKeyItem>): Promise<void> {
    const res = await fetch(`/api/api-keys/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update API key');
  },

  async deleteApiKey(id: string): Promise<void> {
    const res = await fetch(`/api/api-keys/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete API key');
  },

  async testApiKey(id: string): Promise<{ valid: boolean; maskedKey: string; message: string }> {
    const res = await fetch(`/api/api-keys/${id}/test`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to test API key');
    return res.json();
  },

  async rotateApiKey(id: string, newRawKey?: string): Promise<{ success: boolean; maskedKey: string; message: string }> {
    const res = await fetch(`/api/api-keys/${id}/rotate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newRawKey }),
    });
    if (!res.ok) throw new Error('Failed to rotate API key');
    return res.json();
  },

  async reactivateApiKey(id: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`/api/api-keys/${id}/reactivate`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to reactivate API key');
    return res.json();
  },

  // Models
  async getModels(): Promise<ProviderModelItem[]> {
    const res = await fetch('/api/models');
    if (!res.ok) throw new Error('Failed to load models');
    return res.json();
  },

  async createModel(data: Partial<ProviderModelItem>): Promise<ProviderModelItem> {
    const res = await fetch('/api/models', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create model');
    }
    return res.json();
  },

  async updateModel(id: string, data: Partial<ProviderModelItem>): Promise<ProviderModelItem> {
    const res = await fetch(`/api/models/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update model');
    return res.json();
  },

  async deleteModel(id: string): Promise<void> {
    const res = await fetch(`/api/models/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete model');
  },

  async syncFreeModels(): Promise<{ success: boolean; addedCount: number; updatedCount: number; totalFreeModels: number; message: string }> {
    const res = await fetch('/api/models/sync-free', { method: 'POST' });
    if (!res.ok) throw new Error('Failed to auto-fetch free models');
    return res.json();
  },

  // Key Pool
  async getKeyPool(): Promise<{ globalStrategy: string; cooldownDurationSec: number; pools: ProviderPoolGroup[] }> {
    const res = await fetch('/api/key-pool');
    if (!res.ok) throw new Error('Failed to load key pool');
    return res.json();
  },

  async simulateKeyPool(providerId: string, strategy?: string): Promise<{ provider: string; strategyApplied: string; selectedKey: any; reasoning: string }> {
    const res = await fetch('/api/key-pool/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ providerId, strategy }),
    });
    if (!res.ok) throw new Error('Failed to simulate key pool selection');
    return res.json();
  },

  async getRotationAudits(): Promise<import('../types').RotationAuditLog[]> {
    const res = await fetch('/api/key-pool/audits');
    if (!res.ok) throw new Error('Failed to fetch rotation audits');
    return res.json();
  },

  // Client Keys
  async getClientKeys(): Promise<ClientApiKeyItem[]> {
    const res = await fetch('/api/client-keys');
    if (!res.ok) throw new Error('Failed to load client keys');
    return res.json();
  },

  async createClientKey(data: { name: string; reqLimitDaily?: number; tokenLimitDaily?: number; allowedModels?: string[] }): Promise<ClientApiKeyItem> {
    const res = await fetch('/api/client-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create client key');
    }
    return res.json();
  },

  async revokeClientKey(id: string): Promise<void> {
    const res = await fetch(`/api/client-keys/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to revoke client key');
  },

  async rotateClientKey(id: string): Promise<{ success: boolean; rawKeyOnce: string; client: ClientApiKeyItem }> {
    const res = await fetch(`/api/client-keys/${id}/rotate`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to rotate client key');
    return res.json();
  },

  // Logs
  async getLogs(params?: { provider?: string; model?: string; status?: string; search?: string; limit?: number }): Promise<UsageLogItem[]> {
    const query = new URLSearchParams();
    if (params?.provider) query.set('provider', params.provider);
    if (params?.model) query.set('model', params.model);
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);
    if (params?.limit) query.set('limit', String(params.limit));

    const res = await fetch(`/api/logs?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to load logs');
    return res.json();
  },

  async getLogById(id: string): Promise<UsageLogItem> {
    const res = await fetch(`/api/logs/${id}`);
    if (!res.ok) throw new Error('Failed to load log details');
    return res.json();
  },

  getLogsExportUrl(params?: { provider?: string; model?: string; status?: string; search?: string }): string {
    const query = new URLSearchParams();
    if (params?.provider) query.set('provider', params.provider);
    if (params?.model) query.set('model', params.model);
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);
    return `/api/logs/export?${query.toString()}`;
  },

  async exportLogsCsv(params?: { provider?: string; model?: string; status?: string; search?: string }): Promise<Blob> {
    const url = this.getLogsExportUrl(params);
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to export usage logs as CSV');
    return res.blob();
  },

  async clearLogs(): Promise<void> {
    const res = await fetch('/api/logs', { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to clear logs');
  },

  // Errors
  async getErrors(): Promise<ErrorLogItem[]> {
    const res = await fetch('/api/errors');
    if (!res.ok) throw new Error('Failed to load errors');
    return res.json();
  },

  async resolveError(id: string): Promise<void> {
    const res = await fetch(`/api/errors/${id}/resolve`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to resolve error');
  },

  async clearErrors(): Promise<void> {
    const res = await fetch('/api/errors/clear', { method: 'POST' });
    if (!res.ok) throw new Error('Failed to clear errors');
  },

  // Health
  async getHealthStatus(): Promise<HealthCheckItem[]> {
    const res = await fetch('/api/health-status');
    if (!res.ok) throw new Error('Failed to load health status');
    return res.json();
  },

  async checkAllHealth(): Promise<{ success: boolean; health: HealthCheckItem[] }> {
    const res = await fetch('/api/health-status/check-all', { method: 'POST' });
    if (!res.ok) throw new Error('Failed to trigger health checks');
    return res.json();
  },

  // Settings
  async getSettings(): Promise<SystemSettingsState> {
    const res = await fetch('/api/settings');
    if (!res.ok) throw new Error('Failed to load settings');
    return res.json();
  },

  async updateSettings(data: Partial<SystemSettingsState>): Promise<SystemSettingsState> {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update settings');
    const d = await res.json();
    return d.settings;
  },

  // Unified Gateway Chat Completion
  async sendChatCompletion(payload: {
    model: string;
    messages: Array<{ role: string; content: string }>;
    clientKey?: string;
  }): Promise<any> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (payload.clientKey) {
      headers['Authorization'] = `Bearer ${payload.clientKey}`;
    }

    const res = await fetch('/api/v1/chat/completions', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: payload.model,
        messages: payload.messages,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || `HTTP ${res.status}: Gateway error`);
    }
    return data;
  },
};

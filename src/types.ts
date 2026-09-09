export type ViewTab =
  | 'dashboard'
  | 'providers'
  | 'api-keys'
  | 'models'
  | 'key-pool'
  | 'client-keys'
  | 'playground'
  | 'logs'
  | 'errors'
  | 'health'
  | 'settings'
  | 'api-docs';

export type UserRole = 'ADMIN' | 'OPERATOR' | 'VIEWER';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
}

export interface DashboardMetrics {
  providersCount: number;
  apiKeysCount: number;
  activeKeysCount: number;
  errorKeysCount: number;
  modelsCount: number;
  requestsToday: number;
  tokensToday: number;
  successRate: string;
  estimatedCost: string;
  quotaRemaining: string;
}

export interface ChartDataPoint {
  time: string;
  requests: number;
  requestRate: number; // RPM (requests per minute)
  tokens: number;
  promptTokens: number;
  completionTokens: number;
  errors: number;
  errorRate: string;
}

export interface ProviderUsageItem {
  name: string;
  value: number;
  color: string;
}

export interface ModelUsageItem {
  name: string;
  requests: number;
  tokens: number;
}

export interface PredictionDataPoint {
  providerName: string;
  predictedCost: number; // in USD
  projectedTrafficSpike: string; // e.g., "14:00 - 16:00" or "-"
  trend: 'UP' | 'DOWN' | 'STABLE';
  color: string;
}

export interface ProviderItem {
  id: string;
  slug: string;
  name: string;
  logo: string;
  baseUrl: string;
  docsUrl: string;
  status: 'ACTIVE' | 'INACTIVE' | 'DEGRADED' | 'MAINTENANCE';
  authType: 'BEARER_TOKEN' | 'API_KEY_HEADER' | 'QUERY_PARAM';
  rpmLimit: number;
  tpmLimit: number;
  rpdLimit: number;
  freeTier: string;
  notes: string;
  modelsCount: number;
  keysCount: number;
  activeKeysCount: number;
  latencyMs: number;
  healthStatus: 'ONLINE' | 'RATE_LIMITED' | 'OFFLINE';
  createdAt: string;
}

export interface RotationAuditLog {
  id: string;
  timestamp: string;
  providerId: string;
  modelId: string;
  sourceKeyId: string;
  targetKeyId: string;
  triggerErrorCode: string;
  triggerReason: string;
}

export interface ApiKeyItem {
  id: string;
  providerId: string;
  providerName: string;
  providerLogo: string;
  label: string;
  maskedKey: string;
  status: 'ACTIVE' | 'RATE_LIMITED' | 'ERROR' | 'DISABLED' | 'COOLDOWN';
  priority: number;
  failCount: number;
  requestsCount: number;
  tokensCount: number;
  quotaTotal: number;
  quotaUsed: number;
  lastUsedAt: string | null;
  lastError: string | null;
  cooldownUntil: string | null;
  createdAt: string;
}

export interface ProviderModelItem {
  id: string;
  providerId: string;
  providerName: string;
  providerLogo: string;
  name: string;
  modelId: string;
  contextLength: number;
  inputLimit: number;
  outputLimit: number;
  isFree: boolean;
  status: 'active' | 'inactive';
  requestsCount: number;
  tokensCount: number;
  activeKeysCount: number;
  isFallbackEnabled?: boolean;
  fallbackModels?: string[];
}

export type KeyHealthVisualStatus = 'Healthy' | 'Rate-Limited' | 'Failed';

export interface KeyRecentActivity {
  totalRecent: number;
  successCount: number;
  rateLimitCount: number;
  errorCount: number;
  successRate: number;
  lastStatusCode?: number;
  recentStatuses: number[];
  lastSeen?: string | null;
}

export interface KeyPoolItem {
  id: string;
  label: string;
  maskedKey: string;
  status: 'ACTIVE' | 'RATE_LIMITED' | 'ERROR' | 'DISABLED' | 'COOLDOWN';
  healthStatus?: KeyHealthVisualStatus;
  priority: number;
  requestsCount: number;
  failCount: number;
  cooldownUntil: string | null;
  lastError: string | null;
  recentActivity?: KeyRecentActivity;
}

export interface ProviderPoolGroup {
  providerId: string;
  providerName: string;
  providerLogo: string;
  strategy: string;
  totalKeys: number;
  activeKeys: number;
  rateLimitedKeys: number;
  errorKeys: number;
  keys: KeyPoolItem[];
}

export interface ClientApiKeyItem {
  id: string;
  name: string;
  keyPrefix: string;
  prefix?: string;
  keyHash?: string;
  rawKeyOnce?: string;
  status: 'ACTIVE' | 'REVOKED' | 'active' | 'revoked';
  reqLimitDaily: number;
  reqUsedDaily?: number;
  tokenLimitDaily: number;
  tokenUsedDaily?: number;
  allowedModels: string[];
  expiresAt?: string | null;
  lastUsedAt: string | null;
  createdAt: string;
}

export interface ServiceLatencyBreakdown {
  serviceName: string;
  category: 'ingress' | 'auth' | 'routing' | 'security' | 'network' | 'inference' | 'parsing' | 'telemetry';
  latencyMs: number;
  percentage: number;
  status: 'SUCCESS' | 'WARNING' | 'ERROR' | 'SKIPPED';
  details?: string;
}

export interface RequestChainStep {
  stepIndex: number;
  name: string;
  stage:
    | 'client_ingress'
    | 'auth_quota'
    | 'routing'
    | 'key_pool'
    | 'upstream_dispatch'
    | 'model_inference'
    | 'response_transform'
    | 'client_egress';
  service: string;
  status: 'SUCCESS' | 'WARNING' | 'ERROR' | 'SKIPPED';
  durationMs: number;
  timestamp: string;
  summary: string;
  metadata?: Record<string, any>;
  error?: string | null;
}

export interface FullRequestPayload {
  method: string;
  path: string;
  ipAddress: string;
  userAgent?: string;
  headers: Record<string, string>;
  body: {
    model: string;
    messages: Array<{ role: string; content: string }>;
    temperature?: number;
    max_tokens?: number;
    stream?: boolean;
    [key: string]: any;
  };
}

export interface FullResponsePayload {
  statusCode: number;
  statusText: string;
  headers: Record<string, string>;
  body: {
    id: string;
    object: string;
    created: number;
    model: string;
    provider?: string;
    choices?: Array<{
      index: number;
      message: { role: string; content: string };
      finish_reason: string;
    }>;
    usage?: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
    error?: any;
    [key: string]: any;
  };
}

export interface UsageLogItem {
  id: string;
  requestId: string;
  timestamp?: string;
  createdAt: string;
  clientKeyId?: string | null;
  clientName?: string;
  providerId?: string;
  provider: string;
  providerName?: string;
  model: string;
  modelId?: string;
  apiKeyId?: string | null;
  keyLabel?: string;
  maskedKey?: string;
  requestPreview?: string;
  status: number;
  responseStatus?: number;
  promptTokens: number;
  inputTokens?: number;
  completionTokens: number;
  outputTokens?: number;
  totalTokens: number;
  latencyMs: number;
  costEstimated?: number;
  error?: string | null;
  ipAddress?: string;
  latencyBreakdown?: ServiceLatencyBreakdown[];
  requestChain?: RequestChainStep[];
  requestPayload?: FullRequestPayload;
  responsePayload?: FullResponsePayload;
  poolStrategy?: string;
  retryAttempts?: number;
}

export interface ErrorLogItem {
  id: string;
  errorType?: string;
  type?: 'RATE_LIMIT' | 'INVALID_KEY' | 'PROVIDER_OFFLINE' | 'TIMEOUT' | 'QUOTA_EXCEEDED' | string;
  providerId?: string;
  provider?: string;
  providerName?: string;
  keyLabel?: string;
  apiKeyId?: string | null;
  statusCode?: number;
  message: string;
  count: number;
  lastOccurredAt?: string;
  createdAt: string;
  isResolved?: boolean;
  resolved: boolean;
  autoRetried?: boolean;
  cooldownTriggered?: boolean;
}

export interface HealthCheckItem {
  providerId: string;
  providerName: string;
  status: 'ONLINE' | 'RATE_LIMITED' | 'OFFLINE';
  latencyMs: number;
  successRate: number;
  errorRate: number;
  activeKeys: number;
  failedKeys: number;
  checkedAt: string;
}

export interface SystemSettingsState {
  defaultProvider: string;
  defaultModel: string;
  keyRotationStrategy: 'ROUND_ROBIN' | 'LEAST_USED' | 'RANDOM' | 'PRIORITY' | 'FAILOVER';
  retryCount: number;
  timeoutMs: number;
  cooldownSec: number;
  loggingLevel: 'ALL' | 'ERRORS_ONLY' | 'NONE';
  globalRpmLimit: number;
  maintenanceMode: boolean;
}

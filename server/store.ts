import crypto from 'node:crypto';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'OPERATOR' | 'VIEWER';
  avatar?: string;
  passwordHash: string;
  createdAt: string;
}

export interface Provider {
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
  createdAt: string;
}

export interface ProviderModel {
  id: string;
  providerId: string;
  name: string;
  modelId: string;
  contextLength: number;
  inputLimit: number;
  outputLimit: number;
  isFree: boolean;
  status: 'active' | 'inactive';
  requestsCount: number;
  tokensCount: number;
  isFallbackEnabled?: boolean;
  fallbackModels?: string[];
}

export interface ApiKeyItem {
  id: string;
  providerId: string;
  label: string;
  keyHash: string;
  encryptedKey: string;
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

export interface ClientApiKey {
  id: string;
  userId?: string;
  name: string;
  keyPrefix: string;
  keyHash: string;
  rawKeyOnce?: string; // only returned upon immediate creation
  status: 'active' | 'revoked';
  reqLimitDaily: number;
  reqUsedDaily: number;
  tokenLimitDaily: number;
  tokenUsedDaily: number;
  allowedModels: string[];
  expiresAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
}

export interface UsageLog {
  id: string;
  requestId: string;
  timestamp: string;
  clientKeyId: string | null;
  clientName: string;
  providerId: string;
  providerName: string;
  modelId: string;
  apiKeyId: string | null;
  maskedKey: string;
  requestPreview: string;
  responseStatus: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  latencyMs: number;
  costEstimated: number;
  error?: string | null;
  ipAddress: string;
  latencyBreakdown?: any[];
  requestChain?: any[];
  requestPayload?: any;
  responsePayload?: any;
  poolStrategy?: string;
  retryAttempts?: number;
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

export interface ErrorLog {
  id: string;
  errorType: string;
  providerId: string;
  providerName: string;
  apiKeyId: string | null;
  statusCode: number;
  message: string;
  count: number;
  lastOccurredAt: string;
  isResolved: boolean;
  autoRetried: boolean;
  cooldownTriggered: boolean;
}

export interface HealthCheckResult {
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

export interface SystemSettings {
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

const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET || 'freellmhub-secure-aes256-key-32ch';

export function encryptSecret(plain: string): string {
  const key = crypto.createHash('sha256').update(ENCRYPTION_SECRET).digest();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(plain, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

export function decryptSecret(payload: string): string {
  try {
    const [ivHex, dataHex] = payload.split(':');
    if (!ivHex || !dataHex) return 'DECRYPTION_ERROR';
    const key = crypto.createHash('sha256').update(ENCRYPTION_SECRET).digest();
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(dataHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch {
    return 'DECRYPTION_ERROR';
  }
}

export function maskApiKey(raw: string): string {
  const clean = raw.trim();
  if (clean.length <= 8) return '••••••••';
  const prefix = clean.slice(0, 4);
  const suffix = clean.slice(-4);
  return `${prefix}${'•'.repeat(16)}${suffix}`;
}

// In-Memory Database Store Initializer with Realistic Seed Data
class DataStore {
  users: User[] = [];
  providers: Provider[] = [];
  models: ProviderModel[] = [];
  apiKeys: ApiKeyItem[] = [];
  clientKeys: ClientApiKey[] = [];
  usageLogs: UsageLog[] = [];
  errorLogs: ErrorLog[] = [];
  rotationAudits: RotationAuditLog[] = [];
  healthChecks: Map<string, HealthCheckResult> = new Map();
  settings: SystemSettings = {
    defaultProvider: 'google-gemini',
    defaultModel: 'gemini-2.5-flash',
    keyRotationStrategy: 'ROUND_ROBIN',
    retryCount: 3,
    timeoutMs: 30000,
    cooldownSec: 180,
    loggingLevel: 'ALL',
    globalRpmLimit: 120,
    maintenanceMode: false,
  };

  private rotationIndices: Map<string, number> = new Map();

  constructor() {
    this.seed();
  }

  private seed() {
    // 1. Seed Users
    this.users = [
      {
        id: 'usr_admin',
        email: 'admin@freellmhub.dev',
        name: 'Super Administrator',
        role: 'ADMIN',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
        passwordHash: crypto.createHash('sha256').update('admin123').digest('hex'),
        createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      },
      {
        id: 'usr_operator',
        email: 'operator@freellmhub.dev',
        name: 'DevOps Operator',
        role: 'OPERATOR',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
        passwordHash: crypto.createHash('sha256').update('operator123').digest('hex'),
        createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
      },
      {
        id: 'usr_viewer',
        email: 'viewer@freellmhub.dev',
        name: 'Audit Viewer',
        role: 'VIEWER',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
        passwordHash: crypto.createHash('sha256').update('viewer123').digest('hex'),
        createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
      },
    ];

    // 2. Seed Providers
    this.providers = [
      {
        id: 'prov_gemini',
        slug: 'google-gemini',
        name: 'Google Gemini',
        logo: 'Sparkles',
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
        docsUrl: 'https://ai.google.dev/docs',
        status: 'ACTIVE',
        authType: 'API_KEY_HEADER',
        rpmLimit: 15,
        tpmLimit: 1000000,
        rpdLimit: 1500,
        freeTier: '15 RPM / 1M TPM / 1500 RPD free tier with direct Google AI Studio keys',
        notes: 'Native 1M-2M context window. High throughput and multimodal support.',
        createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      },
      {
        id: 'prov_groq',
        slug: 'groq',
        name: 'Groq Cloud',
        logo: 'Zap',
        baseUrl: 'https://api.groq.com/openai/v1',
        docsUrl: 'https://console.groq.com/docs',
        status: 'ACTIVE',
        authType: 'BEARER_TOKEN',
        rpmLimit: 30,
        tpmLimit: 20000,
        rpdLimit: 14400,
        freeTier: 'Free LPU inference with 30 RPM and 14,400 Requests per day',
        notes: 'Blazing fast inference speed (>300 t/s) for open weights like Llama 3.3 and Mixtral.',
        createdAt: new Date(Date.now() - 28 * 86400000).toISOString(),
      },
      {
        id: 'prov_openrouter',
        slug: 'openrouter',
        name: 'OpenRouter',
        logo: 'Layers',
        baseUrl: 'https://openrouter.ai/api/v1',
        docsUrl: 'https://openrouter.ai/docs',
        status: 'ACTIVE',
        authType: 'BEARER_TOKEN',
        rpmLimit: 20,
        tpmLimit: 40000,
        rpdLimit: 2000,
        freeTier: 'Free endpoints tagged with :free (e.g. Llama 3.2 3B, DeepSeek R1)',
        notes: 'Multi-provider router with fallback routing and model aggregation.',
        createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
      },
      {
        id: 'prov_cerebras',
        slug: 'cerebras',
        name: 'Cerebras Cloud',
        logo: 'Cpu',
        baseUrl: 'https://api.cerebras.ai/v1',
        docsUrl: 'https://inference-docs.cerebras.ai',
        status: 'ACTIVE',
        authType: 'BEARER_TOKEN',
        rpmLimit: 30,
        tpmLimit: 60000,
        rpdLimit: 14400,
        freeTier: 'Wafer-scale hardware inference, 1M free tokens per day',
        notes: 'Extreme generation speed for Llama 3.1 8B/70B models.',
        createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
      },
      {
        id: 'prov_mistral',
        slug: 'mistral',
        name: 'Mistral AI',
        logo: 'Wind',
        baseUrl: 'https://api.mistral.ai/v1',
        docsUrl: 'https://docs.mistral.ai',
        status: 'ACTIVE',
        authType: 'BEARER_TOKEN',
        rpmLimit: 10,
        tpmLimit: 30000,
        rpdLimit: 1000,
        freeTier: 'Experimenter plan with access to open weights (Mistral Small, Codestral)',
        notes: 'Excellent European frontier models with strong multilingual and coding capabilities.',
        createdAt: new Date(Date.now() - 18 * 86400000).toISOString(),
      },
      {
        id: 'prov_cohere',
        slug: 'cohere',
        name: 'Cohere',
        logo: 'Compass',
        baseUrl: 'https://api.cohere.com/v2',
        docsUrl: 'https://docs.cohere.com',
        status: 'ACTIVE',
        authType: 'BEARER_TOKEN',
        rpmLimit: 10,
        tpmLimit: 10000,
        rpdLimit: 1000,
        freeTier: 'Trial API keys free for testing and development with Command R+ models',
        notes: 'Top tier for enterprise RAG, citations, and search grounding.',
        createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
      },
      {
        id: 'prov_together',
        slug: 'together-ai',
        name: 'Together AI',
        logo: 'Share2',
        baseUrl: 'https://api.together.xyz/v1',
        docsUrl: 'https://docs.together.ai',
        status: 'ACTIVE',
        authType: 'BEARER_TOKEN',
        rpmLimit: 20,
        tpmLimit: 30000,
        rpdLimit: 2000,
        freeTier: 'Developer trial tier with competitive low-cost inference',
        notes: 'Comprehensive open model catalog including DeepSeek R1 & Qwen 2.5.',
        createdAt: new Date(Date.now() - 12 * 86400000).toISOString(),
      },
      {
        id: 'prov_hf',
        slug: 'huggingface',
        name: 'Hugging Face',
        logo: 'Smile',
        baseUrl: 'https://api-inference.huggingface.co/models',
        docsUrl: 'https://huggingface.co/docs/api-inference',
        status: 'ACTIVE',
        authType: 'BEARER_TOKEN',
        rpmLimit: 20,
        tpmLimit: 25000,
        rpdLimit: 2000,
        freeTier: 'Serverless Inference API free tier using personal HF access token',
        notes: 'Direct access to community fine-tunes and specialized open weights.',
        createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
      },
    ];

    // 3. Seed Models
    this.models = [
      { id: 'mdl_gemini_flash', providerId: 'prov_gemini', name: 'Gemini 2.5 Flash', modelId: 'gemini-2.5-flash', contextLength: 1048576, inputLimit: 1048576, outputLimit: 8192, isFree: true, status: 'active', requestsCount: 1420, tokensCount: 2840000 },
      { id: 'mdl_gemini_pro', providerId: 'prov_gemini', name: 'Gemini 2.5 Pro', modelId: 'gemini-2.5-pro', contextLength: 2097152, inputLimit: 2097152, outputLimit: 8192, isFree: true, status: 'active', requestsCount: 890, tokensCount: 3100000 },
      { id: 'mdl_groq_llama70b', providerId: 'prov_groq', name: 'Llama 3.3 70B Versatile', modelId: 'llama-3.3-70b-versatile', contextLength: 128000, inputLimit: 128000, outputLimit: 8192, isFree: true, status: 'active', requestsCount: 2310, tokensCount: 4200000 },
      { id: 'mdl_groq_llama8b', providerId: 'prov_groq', name: 'Llama 3.1 8B Instant', modelId: 'llama-3.1-8b-instant', contextLength: 128000, inputLimit: 128000, outputLimit: 8192, isFree: true, status: 'active', requestsCount: 1980, tokensCount: 1540000 },
      { id: 'mdl_or_llama32', providerId: 'prov_openrouter', name: 'Llama 3.2 3B Instruct (Free)', modelId: 'meta-llama/llama-3.2-3b-instruct:free', contextLength: 131072, inputLimit: 131072, outputLimit: 4096, isFree: true, status: 'active', requestsCount: 940, tokensCount: 890000 },
      { id: 'mdl_or_deepseek', providerId: 'prov_openrouter', name: 'DeepSeek R1 (Free Route)', modelId: 'deepseek/deepseek-r1:free', contextLength: 65536, inputLimit: 65536, outputLimit: 8192, isFree: true, status: 'active', requestsCount: 1650, tokensCount: 5400000 },
      { id: 'mdl_cerebras_8b', providerId: 'prov_cerebras', name: 'Cerebras Llama 3.1 8B', modelId: 'cerebras-llama3.1-8b', contextLength: 8192, inputLimit: 8192, outputLimit: 4096, isFree: true, status: 'active', requestsCount: 1120, tokensCount: 980000 },
      { id: 'mdl_mistral_small', providerId: 'prov_mistral', name: 'Mistral Small 3', modelId: 'mistral-small-latest', contextLength: 32768, inputLimit: 32768, outputLimit: 4096, isFree: true, status: 'active', requestsCount: 740, tokensCount: 1120000 },
      { id: 'mdl_cohere_cmd', providerId: 'prov_cohere', name: 'Command R+', modelId: 'command-r-plus-08-2024', contextLength: 128000, inputLimit: 128000, outputLimit: 4096, isFree: true, status: 'active', requestsCount: 420, tokensCount: 880000 },
      { id: 'mdl_hf_qwen', providerId: 'prov_hf', name: 'Qwen 2.5 Coder 32B', modelId: 'Qwen/Qwen2.5-Coder-32B-Instruct', contextLength: 32768, inputLimit: 32768, outputLimit: 4096, isFree: true, status: 'active', requestsCount: 530, tokensCount: 760000 },
    ];

    // 4. Seed API Keys with Masking & Encryption
    const sampleKeys = [
      { provId: 'prov_gemini', label: 'Gemini Primary Free #1', raw: 'AIzaSyDemoKeyPrimaryGoogleA1B2C3D4E5', priority: 1, status: 'ACTIVE' as const },
      { provId: 'prov_gemini', label: 'Gemini Secondary Free #2', raw: 'AIzaSyDemoKeyBackupGoogleZ9Y8X7W6V5', priority: 2, status: 'ACTIVE' as const },
      { provId: 'prov_groq', label: 'Groq High-Speed LPU #1', raw: 'gsk_demoKeyGroqAlpha1234567890abcdef', priority: 1, status: 'ACTIVE' as const },
      { provId: 'prov_groq', label: 'Groq High-Speed LPU #2', raw: 'gsk_demoKeyGroqBeta9876543210fedcba', priority: 2, status: 'ACTIVE' as const },
      { provId: 'prov_groq', label: 'Groq Rate-Limited Failover #3', raw: 'gsk_demoKeyGroqGamma429RateLimit5544', priority: 3, status: 'RATE_LIMITED' as const, failCount: 4, lastError: 'HTTP 429 Too Many Requests (RPM limit reached)', cooldownUntil: new Date(Date.now() + 120000).toISOString() },
      { provId: 'prov_openrouter', label: 'OpenRouter Free Pool Key', raw: 'sk-or-v1-demoRouter9876543210fedcba', priority: 1, status: 'ACTIVE' as const },
      { provId: 'prov_cerebras', label: 'Cerebras Fast Tier Key', raw: 'csk-demoWaferInference998877665544', priority: 1, status: 'ACTIVE' as const },
      { provId: 'prov_mistral', label: 'Mistral Free Experimenter', raw: 'mis_demoMistralDevKey112233445566', priority: 1, status: 'ACTIVE' as const },
      { provId: 'prov_cohere', label: 'Cohere Developer Trial Key', raw: 'coh_trialDemoKey8899001122334455', priority: 1, status: 'ACTIVE' as const },
      { provId: 'prov_together', label: 'Together Cloud Key #1', raw: 'tog_demoKeyTogetherAI334455667788', priority: 1, status: 'ACTIVE' as const },
      { provId: 'prov_hf', label: 'HuggingFace Inference Token', raw: 'hf_demoUserTokenHF1234567890abcdef', priority: 1, status: 'ACTIVE' as const },
    ];

    this.apiKeys = sampleKeys.map((k, i) => {
      const keyHash = crypto.createHash('sha256').update(k.raw).digest('hex');
      const encryptedKey = encryptSecret(k.raw);
      const maskedKey = maskApiKey(k.raw);
      const provider = this.providers.find((p) => p.id === k.provId);
      const rpd = provider ? provider.rpdLimit : 1000;
      const used = Math.floor(Math.random() * (rpd * 0.4));

      return {
        id: `key_${i + 1}`,
        providerId: k.provId,
        label: k.label,
        keyHash,
        encryptedKey,
        maskedKey,
        status: k.status,
        priority: k.priority,
        failCount: k.failCount || 0,
        requestsCount: Math.floor(Math.random() * 800) + 120,
        tokensCount: Math.floor(Math.random() * 1500000) + 50000,
        quotaTotal: rpd,
        quotaUsed: used,
        lastUsedAt: new Date(Date.now() - Math.random() * 3600000).toISOString(),
        lastError: k.lastError || null,
        cooldownUntil: k.cooldownUntil || null,
        createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
      };
    });

    // 5. Seed Client API Keys
    this.clientKeys = [
      {
        id: 'clk_1',
        name: 'Internal Production Agent',
        keyPrefix: 'fk_live_prod',
        keyHash: crypto.createHash('sha256').update('fk_live_demo_key_12345').digest('hex'),
        status: 'active',
        reqLimitDaily: 10000,
        reqUsedDaily: 642,
        tokenLimitDaily: 2000000,
        tokenUsedDaily: 489200,
        allowedModels: ['*'],
        expiresAt: new Date(Date.now() + 365 * 86400000).toISOString(),
        lastUsedAt: new Date(Date.now() - 4 * 60000).toISOString(),
        createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
      },
      {
        id: 'clk_2',
        name: 'Analytics & Batch Worker',
        keyPrefix: 'fk_live_batch',
        keyHash: crypto.createHash('sha256').update('fk_live_batch_99887766').digest('hex'),
        status: 'active',
        reqLimitDaily: 5000,
        reqUsedDaily: 184,
        tokenLimitDaily: 1000000,
        tokenUsedDaily: 198400,
        allowedModels: ['gemini-2.5-flash', 'llama-3.3-70b-versatile'],
        expiresAt: new Date(Date.now() + 180 * 86400000).toISOString(),
        lastUsedAt: new Date(Date.now() - 22 * 60000).toISOString(),
        createdAt: new Date(Date.now() - 8 * 86400000).toISOString(),
      },
      {
        id: 'clk_3',
        name: 'Legacy Mobile App Client',
        keyPrefix: 'fk_live_mobile',
        keyHash: crypto.createHash('sha256').update('fk_live_mobile_revoked_key').digest('hex'),
        status: 'revoked',
        reqLimitDaily: 2000,
        reqUsedDaily: 0,
        tokenLimitDaily: 500000,
        tokenUsedDaily: 0,
        allowedModels: ['gemini-2.5-flash'],
        expiresAt: new Date(Date.now() - 5 * 86400000).toISOString(),
        lastUsedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
        createdAt: new Date(Date.now() - 40 * 86400000).toISOString(),
      },
    ];

    // 6. Seed Usage Logs
    const sampleModels = this.models;
    for (let i = 0; i < 25; i++) {
      const m = sampleModels[i % sampleModels.length];
      const p = this.providers.find((prov) => prov.id === m.providerId);
      const isErr = i === 4 || i === 11;
      const status = isErr ? 429 : 200;
      const inTok = Math.floor(Math.random() * 450) + 50;
      const outTok = isErr ? 0 : Math.floor(Math.random() * 850) + 120;
      const latency = isErr ? 45 : Math.floor(Math.random() * 650) + 140;

      this.usageLogs.push({
        id: `log_${i + 1}`,
        requestId: `req_chatcmpl_${crypto.randomBytes(6).toString('hex')}`,
        timestamp: new Date(Date.now() - i * 180000).toISOString(),
        clientKeyId: i % 2 === 0 ? 'clk_1' : 'clk_2',
        clientName: i % 2 === 0 ? 'Internal Production Agent' : 'Analytics & Batch Worker',
        providerId: m.providerId,
        providerName: p ? p.name : 'Unknown Provider',
        modelId: m.modelId,
        apiKeyId: `key_${(i % 5) + 1}`,
        maskedKey: 'sk-••••••••••••••••91ab',
        requestPreview: `User query about ${['code optimization', 'Thai grammar parsing', 'financial summary', 'RAG prompt', 'database index'][i % 5]}`,
        responseStatus: status,
        inputTokens: inTok,
        outputTokens: outTok,
        totalTokens: inTok + outTok,
        latencyMs: latency,
        costEstimated: 0.0, // free tier hub
        error: isErr ? 'Rate limit exceeded (429): Switched to backup key in pool' : null,
        ipAddress: `192.168.1.${10 + (i % 8)}`,
      });
    }

    // 7. Seed Error Logs
    this.errorLogs = [
      {
        id: 'err_1',
        errorType: 'Rate Limit',
        providerId: 'prov_groq',
        providerName: 'Groq Cloud',
        apiKeyId: 'key_5',
        statusCode: 429,
        message: 'TPM threshold exceeded on Groq Key #3. Auto-cooldown initiated.',
        count: 14,
        lastOccurredAt: new Date(Date.now() - 8 * 60000).toISOString(),
        isResolved: false,
        autoRetried: true,
        cooldownTriggered: true,
      },
      {
        id: 'err_2',
        errorType: 'Timeout',
        providerId: 'prov_openrouter',
        providerName: 'OpenRouter',
        apiKeyId: 'key_6',
        statusCode: 504,
        message: 'Upstream connection timed out after 30000ms. Failover route engaged.',
        count: 3,
        lastOccurredAt: new Date(Date.now() - 45 * 60000).toISOString(),
        isResolved: true,
        autoRetried: true,
        cooldownTriggered: false,
      },
      {
        id: 'err_3',
        errorType: 'Model Not Found',
        providerId: 'prov_mistral',
        providerName: 'Mistral AI',
        apiKeyId: 'key_8',
        statusCode: 404,
        message: 'Requested deprecated model identifier "mistral-7b-v0.1". Auto-mapped to "mistral-small-latest".',
        count: 2,
        lastOccurredAt: new Date(Date.now() - 3 * 3600000).toISOString(),
        isResolved: true,
        autoRetried: false,
        cooldownTriggered: false,
      },
    ];

    // 8. Seed Health Checks
    this.providers.forEach((prov) => {
      const isDegraded = prov.id === 'prov_groq';
      this.healthChecks.set(prov.id, {
        providerId: prov.id,
        providerName: prov.name,
        status: isDegraded ? 'RATE_LIMITED' : 'ONLINE',
        latencyMs: Math.floor(Math.random() * 220) + 85,
        successRate: isDegraded ? 94.2 : 99.8,
        errorRate: isDegraded ? 5.8 : 0.2,
        activeKeys: isDegraded ? 2 : 2,
        failedKeys: isDegraded ? 1 : 0,
        checkedAt: new Date(Date.now() - 2 * 60000).toISOString(),
      });
    });

    // Seed some initial rotation audits
    this.rotationAudits = [
      {
        id: `rot_${Date.now() - 10000}`,
        timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
        providerId: 'prv_groq',
        modelId: 'llama3-70b-8192',
        sourceKeyId: 'key_gq2',
        targetKeyId: 'key_gq1',
        triggerErrorCode: '429',
        triggerReason: 'RATE_LIMIT_EXCEEDED'
      },
      {
        id: `rot_${Date.now() - 20000}`,
        timestamp: new Date(Date.now() - 125 * 60000).toISOString(),
        providerId: 'prv_gemini',
        modelId: 'gemini-2.5-flash',
        sourceKeyId: 'key_gm1',
        targetKeyId: 'key_gm3',
        triggerErrorCode: '500',
        triggerReason: 'INTERNAL_SERVER_ERROR'
      },
      {
        id: `rot_${Date.now() - 30000}`,
        timestamp: new Date(Date.now() - 240 * 60000).toISOString(),
        providerId: 'prv_gemini',
        modelId: 'gemini-2.5-pro',
        sourceKeyId: 'key_gm2',
        targetKeyId: 'key_gm1',
        triggerErrorCode: '429',
        triggerReason: 'RATE_LIMIT_EXCEEDED'
      }
    ];
  }

  // Key Pool selection logic according to strategy
  getNextKeyForProvider(providerId: string, strategy: SystemSettings['keyRotationStrategy']): ApiKeyItem | null {
    const now = new Date();

    // First auto-recover any keys whose cooldown expired
    this.apiKeys.forEach((k) => {
      if (k.providerId === providerId && (k.status === 'RATE_LIMITED' || k.status === 'COOLDOWN')) {
        if (k.cooldownUntil && new Date(k.cooldownUntil) <= now) {
          k.status = 'ACTIVE';
          k.cooldownUntil = null;
          k.failCount = 0;
          k.lastError = null;
        }
      }
    });

    const eligibleKeys = this.apiKeys.filter(
      (k) => k.providerId === providerId && k.status === 'ACTIVE'
    );

    if (eligibleKeys.length === 0) {
      return null;
    }

    switch (strategy) {
      case 'ROUND_ROBIN': {
        const curr = this.rotationIndices.get(providerId) || 0;
        const selected = eligibleKeys[curr % eligibleKeys.length];
        this.rotationIndices.set(providerId, (curr + 1) % eligibleKeys.length);
        return selected;
      }
      case 'LEAST_USED': {
        // Sort by requests count ascending
        const sorted = [...eligibleKeys].sort((a, b) => a.requestsCount - b.requestsCount);
        return sorted[0];
      }
      case 'RANDOM': {
        const idx = Math.floor(Math.random() * eligibleKeys.length);
        return eligibleKeys[idx];
      }
      case 'PRIORITY': {
        // Sort by priority ascending (1 is top priority)
        const sorted = [...eligibleKeys].sort((a, b) => a.priority - b.priority);
        return sorted[0];
      }
      case 'FAILOVER':
      default: {
        // Priority first, fall back if fails
        const sorted = [...eligibleKeys].sort((a, b) => a.priority - b.priority);
        return sorted[0];
      }
    }
  }

  markKeyFailure(keyId: string, errorMsg: string, isRateLimit: boolean = true) {
    const key = this.apiKeys.find((k) => k.id === keyId);
    if (!key) return;
    key.failCount += 1;
    key.lastError = errorMsg;

    if (isRateLimit || key.failCount >= 3) {
      key.status = isRateLimit ? 'RATE_LIMITED' : 'ERROR';
      key.cooldownUntil = new Date(Date.now() + this.settings.cooldownSec * 1000).toISOString();

      // Record error log
      const prov = this.providers.find((p) => p.id === key.providerId);
      const existing = this.errorLogs.find((e) => e.apiKeyId === keyId && !e.isResolved);
      if (existing) {
        existing.count += 1;
        existing.lastOccurredAt = new Date().toISOString();
        existing.message = errorMsg;
      } else {
        this.errorLogs.unshift({
          id: `err_${Date.now()}`,
          errorType: isRateLimit ? 'Rate Limit' : 'Provider Offline',
          providerId: key.providerId,
          providerName: prov ? prov.name : 'Unknown',
          apiKeyId: key.id,
          statusCode: isRateLimit ? 429 : 500,
          message: errorMsg,
          count: 1,
          lastOccurredAt: new Date().toISOString(),
          isResolved: false,
          autoRetried: true,
          cooldownTriggered: true,
        });
      }
    }
  }

  recordKeySuccess(keyId: string, inTokens: number, outTokens: number) {
    const key = this.apiKeys.find((k) => k.id === keyId);
    if (!key) return;
    key.requestsCount += 1;
    key.tokensCount += inTokens + outTokens;
    key.quotaUsed += 1;
    key.lastUsedAt = new Date().toISOString();
    key.failCount = 0;
  }
}

export const dbStore = new DataStore();

export function buildTraceForLog(log: UsageLog, poolStrategy: string = 'ROUND_ROBIN') {
  const isError = log.responseStatus !== 200;
  const isRateLimit = log.responseStatus === 429;
  const total = Math.max(log.latencyMs, 20);

  // Calculate realistic service breakdowns proportionally
  const ingressMs = Math.max(1, Math.round(total * 0.02));
  const authMs = Math.max(1, Math.round(total * 0.03));
  const routingMs = Math.max(1, Math.round(total * 0.02));
  const keyPoolMs = Math.max(1, Math.round(total * 0.03));
  const tlsNetworkMs = Math.max(3, Math.round(total * 0.12));
  const parsingMs = isError ? 1 : Math.max(1, Math.round(total * 0.03));
  const telemetryMs = Math.max(1, Math.round(total * 0.02));

  // Upstream inference takes the remainder
  const inferenceMs = isError
    ? Math.max(2, total - (ingressMs + authMs + routingMs + keyPoolMs + tlsNetworkMs + parsingMs + telemetryMs))
    : Math.max(10, total - (ingressMs + authMs + routingMs + keyPoolMs + tlsNetworkMs + parsingMs + telemetryMs));

  const actualTotal = ingressMs + authMs + routingMs + keyPoolMs + tlsNetworkMs + inferenceMs + parsingMs + telemetryMs;

  const latencyBreakdown = [
    {
      serviceName: 'Edge Ingress & TLS Termination',
      category: 'ingress',
      latencyMs: ingressMs,
      percentage: Number(((ingressMs / actualTotal) * 100).toFixed(1)),
      status: 'SUCCESS',
      details: 'HTTP/2 handshake terminated, TLS 1.3 verification, client connection accepted.',
    },
    {
      serviceName: 'Client Auth & Rate Limit Guard',
      category: 'auth',
      latencyMs: authMs,
      percentage: Number(((authMs / actualTotal) * 100).toFixed(1)),
      status: isRateLimit ? 'WARNING' : 'SUCCESS',
      details: `Bearer token authenticated for "${log.clientName}". Daily quota verified (Tier: Free Unlimited).`,
    },
    {
      serviceName: 'Dynamic Router & Model Resolver',
      category: 'routing',
      latencyMs: routingMs,
      percentage: Number(((routingMs / actualTotal) * 100).toFixed(1)),
      status: 'SUCCESS',
      details: `Resolved requested model "${log.modelId}" to upstream provider target "${log.providerName}".`,
    },
    {
      serviceName: 'Key Pool Rotation & Decryption Engine',
      category: 'security',
      latencyMs: keyPoolMs,
      percentage: Number(((keyPoolMs / actualTotal) * 100).toFixed(1)),
      status: isRateLimit ? 'WARNING' : 'SUCCESS',
      details: `Applied pool strategy "${poolStrategy}". Decrypted AES-256 key "${log.maskedKey}".`,
    },
    {
      serviceName: 'Upstream Provider TLS Handshake',
      category: 'network',
      latencyMs: tlsNetworkMs,
      percentage: Number(((tlsNetworkMs / actualTotal) * 100).toFixed(1)),
      status: 'SUCCESS',
      details: `Established persistent HTTP/2 connection with ${log.providerName} API Gateway.`,
    },
    {
      serviceName: 'Upstream LLM Inference Pipeline',
      category: 'inference',
      latencyMs: inferenceMs,
      percentage: Number(((inferenceMs / actualTotal) * 100).toFixed(1)),
      status: isError ? 'ERROR' : 'SUCCESS',
      details: isError
        ? `Upstream provider returned HTTP ${log.responseStatus} (${log.error || 'Rate Limit Exceeded'}).`
        : `Generated ${log.outputTokens} tokens with temperature 0.7 from ${log.modelId}.`,
    },
    {
      serviceName: 'Response Transformer & Tokenizer',
      category: 'parsing',
      latencyMs: parsingMs,
      percentage: Number(((parsingMs / actualTotal) * 100).toFixed(1)),
      status: 'SUCCESS',
      details: `Formatted standard OpenAI chat.completion JSON structure. Verified ${log.inputTokens} prompt + ${log.outputTokens} completion tokens.`,
    },
    {
      serviceName: 'Audit Logging & Telemetry Ingestion',
      category: 'telemetry',
      latencyMs: telemetryMs,
      percentage: Number(((telemetryMs / actualTotal) * 100).toFixed(1)),
      status: 'SUCCESS',
      details: 'Recorded usage metrics, updated provider health latency buffer, persisted audit trail.',
    },
  ];

  // Request chain steps
  const requestChain = [
    {
      stepIndex: 1,
      name: 'Client Ingress',
      stage: 'client_ingress',
      service: 'Nginx / Node HTTP Ingress',
      status: 'SUCCESS',
      durationMs: ingressMs,
      timestamp: log.timestamp,
      summary: `POST /api/v1/chat/completions from IP ${log.ipAddress}`,
      metadata: { ip: log.ipAddress, protocol: 'HTTP/2', method: 'POST', path: '/api/v1/chat/completions' },
    },
    {
      stepIndex: 2,
      name: 'Auth & Token Validation',
      stage: 'auth_quota',
      service: 'Gateway Auth Guard',
      status: 'SUCCESS',
      durationMs: authMs,
      timestamp: new Date(new Date(log.timestamp).getTime() + ingressMs).toISOString(),
      summary: `Validated API Key for client "${log.clientName}"`,
      metadata: { clientKeyId: log.clientKeyId, clientName: log.clientName, authMode: 'Bearer Token' },
    },
    {
      stepIndex: 3,
      name: 'Model & Route Dispatch',
      stage: 'routing',
      service: 'Model Routing Engine',
      status: 'SUCCESS',
      durationMs: routingMs,
      timestamp: new Date(new Date(log.timestamp).getTime() + ingressMs + authMs).toISOString(),
      summary: `Route model "${log.modelId}" -> Provider "${log.providerName}"`,
      metadata: { requestedModel: log.modelId, resolvedProvider: log.providerName },
    },
    {
      stepIndex: 4,
      name: 'Key Pool Selection & Decrypt',
      stage: 'key_pool',
      service: 'AES-256 Vault & Pool Load Balancer',
      status: isRateLimit ? 'WARNING' : 'SUCCESS',
      durationMs: keyPoolMs,
      timestamp: new Date(new Date(log.timestamp).getTime() + ingressMs + authMs + routingMs).toISOString(),
      summary: `Selected key ${log.maskedKey} using ${poolStrategy} strategy`,
      metadata: { strategy: poolStrategy, maskedKey: log.maskedKey, status: 'Active' },
    },
    {
      stepIndex: 5,
      name: 'Upstream Network Dispatch',
      stage: 'upstream_dispatch',
      service: 'Upstream HTTP Proxy',
      status: 'SUCCESS',
      durationMs: tlsNetworkMs,
      timestamp: new Date(new Date(log.timestamp).getTime() + ingressMs + authMs + routingMs + keyPoolMs).toISOString(),
      summary: `Dispatched POST payload to ${log.providerName} API`,
      metadata: { target: log.providerName, stream: false },
    },
    {
      stepIndex: 6,
      name: 'Upstream LLM Inference',
      stage: 'model_inference',
      service: `${log.providerName} Engine (${log.modelId})`,
      status: isError ? 'ERROR' : 'SUCCESS',
      durationMs: inferenceMs,
      timestamp: new Date(new Date(log.timestamp).getTime() + ingressMs + authMs + routingMs + keyPoolMs + tlsNetworkMs).toISOString(),
      summary: isError ? (log.error || 'Upstream Error') : `Generated completion in ${inferenceMs}ms`,
      metadata: {
        model: log.modelId,
        inputTokens: log.inputTokens,
        outputTokens: log.outputTokens,
        finishReason: isError ? 'error' : 'stop',
      },
      error: log.error,
    },
    {
      stepIndex: 7,
      name: 'Response Transform & Telemetry',
      stage: 'response_transform',
      service: 'Gateway Response Formatter',
      status: 'SUCCESS',
      durationMs: parsingMs + telemetryMs,
      timestamp: new Date(new Date(log.timestamp).getTime() + actualTotal - (parsingMs + telemetryMs)).toISOString(),
      summary: `Formatted OpenAI JSON payload & ingested telemetry (Status ${log.responseStatus})`,
      metadata: {
        responseStatus: log.responseStatus,
        totalTokens: log.totalTokens,
        cost: log.costEstimated,
      },
    },
  ];

  const requestPayload = {
    method: 'POST',
    path: '/api/v1/chat/completions',
    ipAddress: log.ipAddress,
    userAgent: 'FreeLLMHub-Client/1.0 (axios/1.6.0; Node.js v20)',
    headers: {
      host: 'api.freellmhub.dev',
      authorization: 'Bearer fk_live_••••••••••••••••',
      'content-type': 'application/json',
      'user-agent': 'FreeLLMHub-Client/1.0',
      'x-forwarded-for': log.ipAddress,
      'x-request-id': log.requestId,
    },
    body: {
      model: log.modelId,
      messages: [
        { role: 'system', content: 'You are a helpful and intelligent AI assistant powered by Free LLM Hub.' },
        { role: 'user', content: log.requestPreview || 'Explain how to optimize database indexing.' },
      ],
      temperature: 0.7,
      max_tokens: 2048,
      stream: false,
    },
  };

  const responsePayload = {
    statusCode: log.responseStatus,
    statusText: log.responseStatus === 200 ? 'OK' : log.responseStatus === 429 ? 'Too Many Requests' : 'Internal Server Error',
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'x-request-id': log.requestId,
      'x-ratelimit-limit-requests': '5000',
      'x-ratelimit-remaining-requests': '4912',
      'x-gateway-latency': `${actualTotal}ms`,
      'x-provider-latency': `${inferenceMs}ms`,
      'x-provider-model': log.modelId,
      'x-provider-name': log.providerName,
    },
    body: isError
      ? {
          error: {
            message: log.error || 'Rate limit reached on upstream provider. Rotated key automatically.',
            type: isRateLimit ? 'rate_limit_error' : 'server_error',
            code: log.responseStatus,
          },
        }
      : {
          id: log.requestId,
          object: 'chat.completion',
          created: Math.floor(new Date(log.timestamp).getTime() / 1000),
          model: log.modelId,
          provider: log.providerName,
          choices: [
            {
              index: 0,
              message: {
                role: 'assistant',
                content: `Response generated by ${log.modelId} via ${log.providerName}.\n\nProcessed prompt (${log.inputTokens} tokens) successfully with end-to-end latency of ${actualTotal}ms.`,
              },
              finish_reason: 'stop',
            },
          ],
          usage: {
            prompt_tokens: log.inputTokens,
            completion_tokens: log.outputTokens,
            total_tokens: log.totalTokens,
          },
        },
  };

  return {
    latencyBreakdown,
    requestChain,
    requestPayload,
    responsePayload,
    poolStrategy,
  };
}

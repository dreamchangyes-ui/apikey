/**
 * Prisma Seed Script for Free LLM Hub
 * Seeds initial providers, models, demo masked keys, settings, and users
 */

import { PrismaClient } from '@prisma/client';
import crypto from 'node:crypto';

const prisma = new PrismaClient();

function encryptKey(plainKey: string, secretKey: string = 'default-32-char-secret-key-123456'): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(secretKey.padEnd(32, '0').slice(0, 32)), iv);
  let encrypted = cipher.update(plainKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

function maskKey(key: string): string {
  if (key.length <= 8) return '••••••••';
  const prefix = key.slice(0, 4);
  const suffix = key.slice(-4);
  return `${prefix}${'•'.repeat(16)}${suffix}`;
}

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Seed Users (Admin, Operator, Viewer)
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@freellmhub.dev' },
    update: {},
    create: {
      email: 'admin@freellmhub.dev',
      name: 'System Administrator',
      passwordHash: crypto.createHash('sha256').update('admin123').digest('hex'),
      role: 'ADMIN',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
    },
  });

  const operatorUser = await prisma.user.upsert({
    where: { email: 'operator@freellmhub.dev' },
    update: {},
    create: {
      email: 'operator@freellmhub.dev',
      name: 'DevOps Operator',
      passwordHash: crypto.createHash('sha256').update('operator123').digest('hex'),
      role: 'OPERATOR',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    },
  });

  console.log('✅ Seeded users');

  // 2. Seed Providers and their Models
  const providersData = [
    {
      slug: 'google-gemini',
      name: 'Google Gemini',
      logo: 'Sparkles',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
      docsUrl: 'https://ai.google.dev/docs',
      status: 'ACTIVE' as const,
      authType: 'API_KEY_HEADER' as const,
      rpmLimit: 15,
      tpmLimit: 1000000,
      rpdLimit: 1500,
      freeTier: '15 RPM / 1M TPM / 1500 RPD completely free with standard API Key',
      notes: 'Gemini 2.5 Flash and Pro models offer generous free tier with high quality and context window.',
      models: [
        { name: 'Gemini 2.5 Flash', modelId: 'gemini-2.5-flash', contextLength: 1048576, inputLimit: 1048576, outputLimit: 8192, isFree: true },
        { name: 'Gemini 2.5 Pro', modelId: 'gemini-2.5-pro', contextLength: 2097152, inputLimit: 2097152, outputLimit: 8192, isFree: true },
        { name: 'Gemini 2.0 Flash Lite', modelId: 'gemini-2.0-flash-lite', contextLength: 1048576, inputLimit: 1048576, outputLimit: 8192, isFree: true },
      ],
      keys: [
        { label: 'Gemini Primary Free Key', demoRaw: 'AIzaSyA1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6' },
        { label: 'Gemini Pool Backup Key #2', demoRaw: 'AIzaSyZ9Y8X7W6V5U4T3S2R1Q0P9O8N7M6L5K4' },
      ],
    },
    {
      slug: 'groq',
      name: 'Groq',
      logo: 'Zap',
      baseUrl: 'https://api.groq.com/openai/v1',
      docsUrl: 'https://console.groq.com/docs',
      status: 'ACTIVE' as const,
      authType: 'BEARER_TOKEN' as const,
      rpmLimit: 30,
      tpmLimit: 20000,
      rpdLimit: 14400,
      freeTier: 'Ultra-fast LPU inference, free tier with 30 RPM and 14,400 RPD for open models',
      notes: 'Fastest token generation for Llama 3.3 and Mixtral.',
      models: [
        { name: 'Llama 3.3 70B Versatile', modelId: 'llama-3.3-70b-versatile', contextLength: 128000, inputLimit: 128000, outputLimit: 8192, isFree: true },
        { name: 'Llama 3.1 8B Instant', modelId: 'llama-3.1-8b-instant', contextLength: 128000, inputLimit: 128000, outputLimit: 8192, isFree: true },
        { name: 'Mixtral 8x7B 32k', modelId: 'mixtral-8x7b-32768', contextLength: 32768, inputLimit: 32768, outputLimit: 4096, isFree: true },
      ],
      keys: [
        { label: 'Groq Cluster Key Alpha', demoRaw: 'gsk_7j8k9l0m1n2o3p4q5r6s7t8u9v0w1x2y3z' },
        { label: 'Groq Cluster Key Beta', demoRaw: 'gsk_1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q' },
        { label: 'Groq Rate-Limited Failover', demoRaw: 'gsk_9z8y7x6w5v4u3t2s1r0q9p8o7n6m5l4k3j' },
      ],
    },
    {
      slug: 'openrouter',
      name: 'OpenRouter',
      logo: 'Layers',
      baseUrl: 'https://openrouter.ai/api/v1',
      docsUrl: 'https://openrouter.ai/docs',
      status: 'ACTIVE' as const,
      authType: 'BEARER_TOKEN' as const,
      rpmLimit: 20,
      tpmLimit: 40000,
      rpdLimit: 2000,
      freeTier: 'Free models tagged with :free suffix (e.g. meta-llama/llama-3.2-3b-instruct:free)',
      notes: 'Unified aggregator supporting over 200+ models with free rotation routes.',
      models: [
        { name: 'Llama 3.2 3B Instruct (Free)', modelId: 'meta-llama/llama-3.2-3b-instruct:free', contextLength: 131072, inputLimit: 131072, outputLimit: 4096, isFree: true },
        { name: 'DeepSeek R1 Free', modelId: 'deepseek/deepseek-r1:free', contextLength: 65536, inputLimit: 65536, outputLimit: 8192, isFree: true },
        { name: 'Qwen 2.5 72B Instruct Free', modelId: 'qwen/qwen-2.5-72b-instruct:free', contextLength: 32768, inputLimit: 32768, outputLimit: 4096, isFree: true },
      ],
      keys: [
        { label: 'OpenRouter Shared Key', demoRaw: 'sk-or-v1-9876543210abcdef0123456789abcdef' },
      ],
    },
    {
      slug: 'cerebras',
      name: 'Cerebras',
      logo: 'Cpu',
      baseUrl: 'https://api.cerebras.ai/v1',
      docsUrl: 'https://inference-docs.cerebras.ai',
      status: 'ACTIVE' as const,
      authType: 'BEARER_TOKEN' as const,
      rpmLimit: 30,
      tpmLimit: 60000,
      rpdLimit: 14400,
      freeTier: 'Wafer-scale engine with instant inference, 1M free tokens per day during preview',
      notes: 'Super low latency processing for Llama 3.1 70B & 8B.',
      models: [
        { name: 'Cerebras Llama 3.1 8B', modelId: 'cerebras-llama3.1-8b', contextLength: 8192, inputLimit: 8192, outputLimit: 4096, isFree: true },
        { name: 'Cerebras Llama 3.3 70B', modelId: 'cerebras-llama3.3-70b', contextLength: 8192, inputLimit: 8192, outputLimit: 4096, isFree: true },
      ],
      keys: [
        { label: 'Cerebras High-Speed Key', demoRaw: 'csk-5544332211aabbccddeeff0011223344' },
      ],
    },
    {
      slug: 'mistral',
      name: 'Mistral AI',
      logo: 'Wind',
      baseUrl: 'https://api.mistral.ai/v1',
      docsUrl: 'https://docs.mistral.ai',
      status: 'ACTIVE' as const,
      authType: 'BEARER_TOKEN' as const,
      rpmLimit: 10,
      tpmLimit: 30000,
      rpdLimit: 1000,
      freeTier: 'La Plateforme experimenter plan with free tier credits and open models',
      notes: 'High-performing European multilingual models.',
      models: [
        { name: 'Mistral Small 3', modelId: 'mistral-small-latest', contextLength: 32768, inputLimit: 32768, outputLimit: 4096, isFree: true },
        { name: 'Codestral 2501', modelId: 'codestral-latest', contextLength: 256000, inputLimit: 256000, outputLimit: 8192, isFree: true },
      ],
      keys: [
        { label: 'Mistral Developer Key', demoRaw: 'mis_xyz987654321fedcba0123456789' },
      ],
    },
    {
      slug: 'cohere',
      name: 'Cohere',
      logo: 'Compass',
      baseUrl: 'https://api.cohere.com/v2',
      docsUrl: 'https://docs.cohere.com',
      status: 'ACTIVE' as const,
      authType: 'BEARER_TOKEN' as const,
      rpmLimit: 10,
      tpmLimit: 10000,
      rpdLimit: 1000,
      freeTier: 'Free trial key for developer experimentation, rate-limited to 10 RPM',
      notes: 'Specialized in RAG, search, and Command R+ family.',
      models: [
        { name: 'Command R+', modelId: 'command-r-plus-08-2024', contextLength: 128000, inputLimit: 128000, outputLimit: 4096, isFree: true },
        { name: 'Command R', modelId: 'command-r-08-2024', contextLength: 128000, inputLimit: 128000, outputLimit: 4096, isFree: true },
      ],
      keys: [
        { label: 'Cohere Trial Key', demoRaw: 'coh_trial_key_11223344556677889900' },
      ],
    },
    {
      slug: 'together-ai',
      name: 'Together AI',
      logo: 'Share2',
      baseUrl: 'https://api.together.xyz/v1',
      docsUrl: 'https://docs.together.ai',
      status: 'ACTIVE' as const,
      authType: 'BEARER_TOKEN' as const,
      rpmLimit: 20,
      tpmLimit: 30000,
      rpdLimit: 2000,
      freeTier: 'Initial $5 free trial credits with competitive open-source inference pricing',
      notes: 'DeepSeek R1 and Qwen hosting.',
      models: [
        { name: 'Together DeepSeek R1', modelId: 'deepseek-ai/DeepSeek-R1', contextLength: 64000, inputLimit: 64000, outputLimit: 8192, isFree: false },
      ],
      keys: [
        { label: 'Together Cloud Key', demoRaw: 'tog_key_99887766554433221100' },
      ],
    },
    {
      slug: 'huggingface',
      name: 'Hugging Face',
      logo: 'Smile',
      baseUrl: 'https://api-inference.huggingface.co/models',
      docsUrl: 'https://huggingface.co/docs/api-inference',
      status: 'ACTIVE' as const,
      authType: 'BEARER_TOKEN' as const,
      rpmLimit: 20,
      tpmLimit: 25000,
      rpdLimit: 2000,
      freeTier: 'Free Serverless Inference API with standard personal access token',
      notes: 'Thousands of open community models with zero-cost inference.',
      models: [
        { name: 'Qwen 2.5 Coder 32B', modelId: 'Qwen/Qwen2.5-Coder-32B-Instruct', contextLength: 32768, inputLimit: 32768, outputLimit: 4096, isFree: true },
      ],
      keys: [
        { label: 'HF User Token', demoRaw: 'hf_XyZ123456789AbCdEfGhIjKlMnOp' },
      ],
    },
  ];

  for (const p of providersData) {
    const provider = await prisma.provider.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        slug: p.slug,
        name: p.name,
        logo: p.logo,
        baseUrl: p.baseUrl,
        docsUrl: p.docsUrl,
        status: p.status,
        authType: p.authType,
        rpmLimit: p.rpmLimit,
        tpmLimit: p.tpmLimit,
        rpdLimit: p.rpdLimit,
        freeTier: p.freeTier,
        notes: p.notes,
      },
    });

    for (const m of p.models) {
      await prisma.providerModel.upsert({
        where: {
          providerId_modelId: {
            providerId: provider.id,
            modelId: m.modelId,
          },
        },
        update: {},
        create: {
          providerId: provider.id,
          name: m.name,
          modelId: m.modelId,
          contextLength: m.contextLength,
          inputLimit: m.inputLimit,
          outputLimit: m.outputLimit,
          isFree: m.isFree,
          status: 'active',
          requestsCount: Math.floor(Math.random() * 400) + 50,
          tokensCount: BigInt(Math.floor(Math.random() * 800000) + 100000),
        },
      });
    }

    for (let idx = 0; idx < p.keys.length; idx++) {
      const k = p.keys[idx];
      const keyHash = crypto.createHash('sha256').update(k.demoRaw).digest('hex');
      const encryptedKey = encryptKey(k.demoRaw);
      const masked = maskKey(k.demoRaw);
      const isRateLimited = idx === 2; // key #3 is rate-limited for groq to demo failover

      await prisma.apiKey.create({
        data: {
          providerId: provider.id,
          label: k.label,
          keyHash,
          encryptedKey,
          maskedKey: masked,
          status: isRateLimited ? 'RATE_LIMITED' : 'ACTIVE',
          priority: idx + 1,
          failCount: isRateLimited ? 3 : 0,
          requestsCount: Math.floor(Math.random() * 1200) + 100,
          tokensCount: BigInt(Math.floor(Math.random() * 2000000) + 50000),
          quotaTotal: p.rpdLimit,
          quotaUsed: Math.floor(Math.random() * 400),
          lastUsedAt: new Date(Date.now() - Math.random() * 3600000),
          lastError: isRateLimited ? 'HTTP 429 Too Many Requests: Rate limit reached' : null,
          cooldownUntil: isRateLimited ? new Date(Date.now() + 180000) : null,
        },
      });
    }
  }

  console.log('✅ Seeded providers, models, and API keys');

  // 3. Seed Client API Key
  const clientKeyRaw = 'fk_live_' + crypto.randomBytes(16).toString('hex');
  const clientKeyHash = crypto.createHash('sha256').update(clientKeyRaw).digest('hex');

  await prisma.clientApiKey.create({
    data: {
      name: 'Default App Gateway Client',
      keyPrefix: 'fk_live_98a7',
      keyHash: clientKeyHash,
      status: 'active',
      userId: adminUser.id,
      reqLimitDaily: 10000,
      reqUsedDaily: 342,
      tokenLimitDaily: 1000000,
      tokenUsedDaily: 128450,
      allowedModels: ['*'],
    },
  });

  // 4. Seed Settings
  const defaultSettings = [
    { key: 'DEFAULT_PROVIDER', value: 'google-gemini', description: 'Default provider when not specified in gateway' },
    { key: 'DEFAULT_MODEL', value: 'gemini-2.5-flash', description: 'Default chat model' },
    { key: 'KEY_ROTATION_STRATEGY', value: 'ROUND_ROBIN', description: 'ROUND_ROBIN, LEAST_USED, RANDOM, PRIORITY, FAILOVER' },
    { key: 'MAX_RETRY_COUNT', value: '3', description: 'Automatic retries on 429 or 5xx provider failures' },
    { key: 'REQUEST_TIMEOUT_MS', value: '30000', description: 'Gateway HTTP timeout in milliseconds' },
    { key: 'COOLDOWN_DURATION_SEC', value: '300', description: 'Cooldown period for rate-limited keys in seconds' },
    { key: 'MAINTENANCE_MODE', value: 'false', description: 'Disable API Gateway for scheduled maintenance' },
    { key: 'LOGGING_LEVEL', value: 'ALL', description: 'ALL, ERRORS_ONLY, NONE' },
  ];

  for (const s of defaultSettings) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      update: {},
      create: s,
    });
  }

  console.log('✅ Seeded system settings');
  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

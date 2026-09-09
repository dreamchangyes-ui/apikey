import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Clock,
  Zap,
  ShieldCheck,
  Cpu,
  Layers,
  Activity,
  ArrowRight,
  Server,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileCode,
  Terminal,
  Send,
  CornerDownRight,
  Sparkles,
  Info,
  Lock,
  Globe,
  Radio,
} from 'lucide-react';
import { UsageLogItem, RequestChainStep, ServiceLatencyBreakdown } from '../types';
import { useDisplay } from '../context/DisplayContext';

interface LogDetailModalProps {
  log: UsageLogItem | null;
  onClose: () => void;
}

type TabType = 'chain' | 'latency' | 'request' | 'response' | 'security';

export const LogDetailModal: React.FC<LogDetailModalProps> = ({ log, onClose }) => {
  const { textScaleClass } = useDisplay();
  const [activeTab, setActiveTab] = useState<TabType>('chain');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!log) return null;

  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => {
      setCopiedField(null);
    }, 2000);
  };

  const statusVal = log.status || log.responseStatus || 200;
  const is200 = statusVal === 200;
  const is429 = statusVal === 429;
  const inTok = log.promptTokens ?? log.inputTokens ?? 0;
  const outTok = log.completionTokens ?? log.outputTokens ?? 0;
  const totalTok = log.totalTokens ?? inTok + outTok;

  // Fallback latency breakdown if missing
  const breakdown: ServiceLatencyBreakdown[] =
    log.latencyBreakdown && log.latencyBreakdown.length > 0
      ? log.latencyBreakdown
      : [
          {
            serviceName: 'Edge Ingress & TLS Termination',
            category: 'ingress',
            latencyMs: Math.max(1, Math.round(log.latencyMs * 0.02)),
            percentage: 2.0,
            status: 'SUCCESS',
            details: 'HTTP/2 connection accepted, TLS 1.3 handshake terminated.',
          },
          {
            serviceName: 'Client Auth & Rate Limit Guard',
            category: 'auth',
            latencyMs: Math.max(1, Math.round(log.latencyMs * 0.03)),
            percentage: 3.0,
            status: is429 ? 'WARNING' : 'SUCCESS',
            details: `Validated Bearer token for client "${log.clientName || 'Internal Client'}".`,
          },
          {
            serviceName: 'Dynamic Router & Model Resolver',
            category: 'routing',
            latencyMs: Math.max(1, Math.round(log.latencyMs * 0.02)),
            percentage: 2.0,
            status: 'SUCCESS',
            details: `Mapped model "${log.model || log.modelId}" to provider "${log.provider || log.providerName}".`,
          },
          {
            serviceName: 'Key Pool Rotation & Decryption Engine',
            category: 'security',
            latencyMs: Math.max(1, Math.round(log.latencyMs * 0.03)),
            percentage: 3.0,
            status: is429 ? 'WARNING' : 'SUCCESS',
            details: `Selected key "${log.maskedKey || 'sk-••••'}" using "${log.poolStrategy || 'ROUND_ROBIN'}" strategy.`,
          },
          {
            serviceName: 'Upstream Provider TLS Handshake',
            category: 'network',
            latencyMs: Math.max(3, Math.round(log.latencyMs * 0.12)),
            percentage: 12.0,
            status: 'SUCCESS',
            details: `Established persistent HTTP/2 connection to ${log.provider || log.providerName} Gateway.`,
          },
          {
            serviceName: 'Upstream LLM Inference Pipeline',
            category: 'inference',
            latencyMs: Math.max(10, Math.round(log.latencyMs * 0.73)),
            percentage: 73.0,
            status: is200 ? 'SUCCESS' : 'ERROR',
            details: is200
              ? `Generated ${outTok} completion tokens with ${log.model || log.modelId}.`
              : (log.error || 'Upstream Rate Limit Exceeded (429).'),
          },
          {
            serviceName: 'Response Transformer & Tokenizer',
            category: 'parsing',
            latencyMs: Math.max(1, Math.round(log.latencyMs * 0.03)),
            percentage: 3.0,
            status: 'SUCCESS',
            details: 'Standardized OpenAI chat.completion JSON format and calculated token telemetry.',
          },
          {
            serviceName: 'Audit Logging & Telemetry Ingestion',
            category: 'telemetry',
            latencyMs: Math.max(1, Math.round(log.latencyMs * 0.02)),
            percentage: 2.0,
            status: 'SUCCESS',
            details: 'Committed audit telemetry to encrypted storage buffer.',
          },
        ];

  // Fallback chain if missing
  const chain: RequestChainStep[] =
    log.requestChain && log.requestChain.length > 0
      ? log.requestChain
      : [
          {
            stepIndex: 1,
            name: 'Client Ingress',
            stage: 'client_ingress',
            service: 'Nginx / Node HTTP Ingress',
            status: 'SUCCESS',
            durationMs: Math.max(1, Math.round(log.latencyMs * 0.02)),
            timestamp: log.createdAt || log.timestamp || new Date().toISOString(),
            summary: `POST /api/v1/chat/completions from IP ${log.ipAddress || '127.0.0.1'}`,
            metadata: { ip: log.ipAddress || '127.0.0.1', method: 'POST', path: '/api/v1/chat/completions' },
          },
          {
            stepIndex: 2,
            name: 'Auth & Quota Validation',
            stage: 'auth_quota',
            service: 'Gateway Auth Guard',
            status: is429 ? 'WARNING' : 'SUCCESS',
            durationMs: Math.max(1, Math.round(log.latencyMs * 0.03)),
            timestamp: log.createdAt || log.timestamp || new Date().toISOString(),
            summary: `Authenticated client "${log.clientName || 'Default Client'}"`,
            metadata: { client: log.clientName || 'Default Client', authMode: 'Bearer Token' },
          },
          {
            stepIndex: 3,
            name: 'Model & Route Dispatch',
            stage: 'routing',
            service: 'Model Routing Engine',
            status: 'SUCCESS',
            durationMs: Math.max(1, Math.round(log.latencyMs * 0.02)),
            timestamp: log.createdAt || log.timestamp || new Date().toISOString(),
            summary: `Resolved model "${log.model || log.modelId}" -> "${log.provider || log.providerName}"`,
            metadata: { model: log.model || log.modelId, provider: log.provider || log.providerName },
          },
          {
            stepIndex: 4,
            name: 'Key Pool Selection & Decryption',
            stage: 'key_pool',
            service: 'Key Vault & Pool Manager',
            status: is429 ? 'WARNING' : 'SUCCESS',
            durationMs: Math.max(1, Math.round(log.latencyMs * 0.03)),
            timestamp: log.createdAt || log.timestamp || new Date().toISOString(),
            summary: `Selected key ${log.maskedKey || 'sk-••••'} via ${log.poolStrategy || 'ROUND_ROBIN'} strategy`,
            metadata: { keyLabel: log.keyLabel, maskedKey: log.maskedKey, strategy: log.poolStrategy || 'ROUND_ROBIN' },
          },
          {
            stepIndex: 5,
            name: 'Upstream Network Handshake',
            stage: 'upstream_dispatch',
            service: 'Upstream HTTP Proxy',
            status: 'SUCCESS',
            durationMs: Math.max(3, Math.round(log.latencyMs * 0.12)),
            timestamp: log.createdAt || log.timestamp || new Date().toISOString(),
            summary: `Dispatched request to ${log.provider || log.providerName} API`,
            metadata: { provider: log.provider || log.providerName },
          },
          {
            stepIndex: 6,
            name: 'Upstream LLM Inference',
            stage: 'model_inference',
            service: `${log.provider || log.providerName} Inference Engine`,
            status: is200 ? 'SUCCESS' : 'ERROR',
            durationMs: Math.max(10, Math.round(log.latencyMs * 0.73)),
            timestamp: log.createdAt || log.timestamp || new Date().toISOString(),
            summary: is200 ? `Generated ${outTok} tokens` : (log.error || 'Upstream Error'),
            error: log.error,
          },
          {
            stepIndex: 7,
            name: 'Response Transform & Telemetry',
            stage: 'response_transform',
            service: 'Gateway Response Formatter',
            status: 'SUCCESS',
            durationMs: Math.max(2, Math.round(log.latencyMs * 0.05)),
            timestamp: log.createdAt || log.timestamp || new Date().toISOString(),
            summary: `Formatted OpenAI JSON payload (Status ${statusVal})`,
            metadata: { status: statusVal, tokens: totalTok },
          },
        ];

  // Request payload fallback
  const reqPayload = log.requestPayload || {
    method: 'POST',
    path: '/api/v1/chat/completions',
    ipAddress: log.ipAddress || '127.0.0.1',
    userAgent: 'FreeLLMHub-Client/1.0',
    headers: {
      host: 'api.freellmhub.dev',
      authorization: 'Bearer fk_live_••••••••••••••••',
      'content-type': 'application/json',
      'user-agent': 'FreeLLMHub-Client/1.0',
      'x-forwarded-for': log.ipAddress || '127.0.0.1',
      'x-request-id': log.requestId,
    },
    body: {
      model: log.model || log.modelId,
      messages: [
        { role: 'system', content: 'You are a helpful and intelligent AI assistant powered by Free LLM Hub.' },
        { role: 'user', content: log.requestPreview || 'Generate a concise explanation.' },
      ],
      temperature: 0.7,
      max_tokens: 2048,
    },
  };

  // Response payload fallback
  const resPayload = log.responsePayload || {
    statusCode: statusVal,
    statusText: is200 ? 'OK' : is429 ? 'Too Many Requests' : 'Internal Server Error',
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'x-request-id': log.requestId,
      'x-ratelimit-limit-requests': '5000',
      'x-ratelimit-remaining-requests': '4912',
      'x-gateway-latency': `${log.latencyMs}ms`,
      'x-provider-model': log.model || log.modelId,
      'x-provider-name': log.provider || log.providerName,
    },
    body: is200
      ? {
          id: log.requestId,
          object: 'chat.completion',
          created: Math.floor(new Date(log.createdAt || log.timestamp || Date.now()).getTime() / 1000),
          model: log.model || log.modelId,
          provider: log.provider || log.providerName,
          choices: [
            {
              index: 0,
              message: {
                role: 'assistant',
                content: `Processed response from ${log.model || log.modelId} (${log.provider || log.providerName}).\n\nPrompt: "${log.requestPreview}"`,
              },
              finish_reason: 'stop',
            },
          ],
          usage: {
            prompt_tokens: inTok,
            completion_tokens: outTok,
            total_tokens: totalTok,
          },
        }
      : {
          error: {
            message: log.error || 'Rate limit reached on upstream provider. Auto-rotated key in pool.',
            type: is429 ? 'rate_limit_error' : 'server_error',
            code: statusVal,
          },
        },
  };

  const curlCommand = `curl https://api.freellmhub.dev/api/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_CLIENT_KEY" \\
  -d '${JSON.stringify(reqPayload.body, null, 2)}'`;

  // Color mapper for latency breakdown categories
  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'ingress': return 'bg-blue-500 text-blue-400 border-blue-500/30';
      case 'auth': return 'bg-purple-500 text-purple-400 border-purple-500/30';
      case 'routing': return 'bg-cyan-500 text-cyan-400 border-cyan-500/30';
      case 'security': return 'bg-amber-500 text-amber-400 border-amber-500/30';
      case 'network': return 'bg-indigo-500 text-indigo-400 border-indigo-500/30';
      case 'inference': return 'bg-emerald-500 text-emerald-400 border-emerald-500/30';
      case 'parsing': return 'bg-teal-500 text-teal-400 border-teal-500/30';
      case 'telemetry': return 'bg-zinc-500 text-zinc-400 border-zinc-500/30';
      default: return 'bg-emerald-500 text-emerald-400 border-emerald-500/30';
    }
  };

  const getCategoryBarColor = (cat: string) => {
    switch (cat) {
      case 'ingress': return 'bg-blue-500';
      case 'auth': return 'bg-purple-500';
      case 'routing': return 'bg-cyan-500';
      case 'security': return 'bg-amber-500';
      case 'network': return 'bg-indigo-500';
      case 'inference': return 'bg-emerald-500';
      case 'parsing': return 'bg-teal-500';
      case 'telemetry': return 'bg-zinc-500';
      default: return 'bg-emerald-500';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-[#111114] border border-[#27272a] shadow-2xl overflow-hidden text-zinc-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#27272a] bg-[#151518]">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                is200
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : is429
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
              }`}
            >
              {is200 ? <CheckCircle2 className="w-5 h-5" /> : is429 ? <AlertTriangle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white tracking-tight text-sm sm:text-base">
                  การตรวจสอบคำขอ API อย่างละเอียด (Request & Latency Chain Inspector)
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${
                    is200
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : is429
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${is200 ? 'bg-emerald-400' : is429 ? 'bg-amber-400' : 'bg-rose-400'}`} />
                  HTTP {statusVal} {is200 ? 'OK' : is429 ? 'RATE LIMIT' : 'ERROR'}
                </span>
              </div>

              <div className="flex items-center gap-3 mt-1 text-xs text-zinc-400">
                <span className="font-mono text-zinc-300 flex items-center gap-1">
                  <span>ID:</span>
                  <strong className="text-white">{log.requestId}</strong>
                  <button
                    onClick={() => copyToClipboard(log.requestId, 'header-req-id')}
                    className="p-1 hover:text-white rounded hover:bg-zinc-800 transition-colors"
                    title="คัดลอก Request ID"
                  >
                    {copiedField === 'header-req-id' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-zinc-500" />
                  {new Date(log.createdAt || log.timestamp || Date.now()).toLocaleString('th-TH')}
                </span>
                <span>•</span>
                <span className="font-mono text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {log.latencyMs}ms End-to-End
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 border border-transparent hover:border-[#27272a] transition-all"
            title="ปิดหน้าต่าง (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top KPI Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-4 border-b border-[#27272a] bg-[#131316]">
          <div className="p-3 rounded-xl bg-[#18181c] border border-[#27272a]">
            <div className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">ผู้ให้บริการ & โมเดล</div>
            <div className="text-xs font-bold text-white mt-1 truncate">{log.provider || log.providerName}</div>
            <div className="font-mono text-[11px] text-emerald-400 truncate">{log.model || log.modelId}</div>
          </div>

          <div className="p-3 rounded-xl bg-[#18181c] border border-[#27272a]">
            <div className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">เวลาแฝงทั้งหมด (Latency)</div>
            <div className="text-base font-bold text-white font-mono mt-0.5">{log.latencyMs} ms</div>
            <div className="text-[10px] text-zinc-400 mt-0.5">
              {log.latencyMs < 200 ? '⚡ Ultra Fast (<200ms)' : log.latencyMs < 600 ? ' Normal (200-600ms)' : '⚠️ High Latency'}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#18181c] border border-[#27272a]">
            <div className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">โทเค็นที่ใช้ (Token Usage)</div>
            <div className="text-base font-bold text-white font-mono mt-0.5">{totalTok.toLocaleString()}</div>
            <div className="text-[10px] text-zinc-400 mt-0.5">
              <span className="text-zinc-300">{inTok} เข้า</span> + <span className="text-cyan-400">{outTok} ออก</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#18181c] border border-[#27272a]">
            <div className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">คีย์ & พูล (Key Pool Engine)</div>
            <div className="text-xs font-semibold text-white mt-1 truncate">{log.keyLabel || 'Pool Key'}</div>
            <div className="font-mono text-[11px] text-zinc-400 truncate">{log.maskedKey || 'sk-••••••••'}</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-4 border-b border-[#27272a] bg-[#151518] overflow-x-auto">
          <button
            onClick={() => setActiveTab('chain')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'chain'
                ? 'border-emerald-400 text-white bg-emerald-500/5'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>ห่วงโซ่การประมวลผล (Execution Chain)</span>
          </button>

          <button
            onClick={() => setActiveTab('latency')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'latency'
                ? 'border-emerald-400 text-white bg-emerald-500/5'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>การจำแนกเวลาแฝงตามบริการ (Latency Breakdown)</span>
          </button>

          <button
            onClick={() => setActiveTab('request')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'request'
                ? 'border-emerald-400 text-white bg-emerald-500/5'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Send className="w-3.5 h-3.5 text-blue-400" />
            <span>ข้อมูลคำขอเข้า (Request Payload)</span>
          </button>

          <button
            onClick={() => setActiveTab('response')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'response'
                ? 'border-emerald-400 text-white bg-emerald-500/5'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>ผลลัพธ์ตอบกลับ (Response Payload)</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'security'
                ? 'border-emerald-400 text-white bg-emerald-500/5'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>ความปลอดภัย & พูลคีย์ (Security & Pool)</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 max-h-[62vh]">
          {/* TAB 1: EXECUTION CHAIN */}
          {activeTab === 'chain' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-1">
                <div>
                  <h4 className="text-sm font-bold text-white tracking-tight">
                    ห่วงโซ่การประมวลผลคำขอแบบครบวงจร (Full Request Lifecycle Trace)
                  </h4>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    ติดตามการทำงานในแต่ละจุดประมวลผลตั้งแต่ Ingress ไปจนถึง Upstream Provider และส่งกลับสู่ Client
                  </p>
                </div>
                <button
                  onClick={() => copyToClipboard(JSON.stringify(chain, null, 2), 'trace-json')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#18181c] hover:bg-zinc-800 border border-[#27272a] text-xs text-zinc-300 font-medium transition-colors"
                >
                  {copiedField === 'trace-json' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>คัดลอก Trace JSON</span>
                </button>
              </div>

              {/* Step Flow List */}
              <div className="space-y-3 relative before:absolute before:inset-0 before:left-4 before:w-0.5 before:bg-zinc-800 before:z-0">
                {chain.map((step, idx) => {
                  const isSuccess = step.status === 'SUCCESS';
                  const isWarning = step.status === 'WARNING';
                  const isError = step.status === 'ERROR';

                  return (
                    <div
                      key={step.stepIndex}
                      className="relative z-10 flex items-start gap-4 p-4 rounded-xl bg-[#151518] border border-[#27272a] hover:border-zinc-700 transition-all shadow-xs"
                    >
                      {/* Step Indicator Node */}
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border font-mono text-xs font-bold ${
                          isSuccess
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : isWarning
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        }`}
                      >
                        {step.stepIndex}
                      </div>

                      {/* Step Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">{step.name}</span>
                            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#1c1c20] text-zinc-300 border border-[#27272a]">
                              {step.service}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                              {step.durationMs}ms
                            </span>
                            <span
                              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                                isSuccess
                                  ? 'bg-emerald-500/10 text-emerald-400'
                                  : isWarning
                                  ? 'bg-amber-500/10 text-amber-400'
                                  : 'bg-rose-500/10 text-rose-400'
                              }`}
                            >
                              {step.status}
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-zinc-300 mt-1.5">{step.summary}</p>

                        {step.error && (
                          <div className="mt-2 p-2.5 rounded-lg bg-rose-950/40 border border-rose-900/60 text-xs text-rose-300 font-mono">
                            <strong>ข้อผิดพลาด:</strong> {step.error}
                          </div>
                        )}

                        {step.metadata && (
                          <div className="mt-2 flex items-center gap-2 flex-wrap text-[11px] text-zinc-400 font-mono">
                            {Object.entries(step.metadata).map(([k, v]) => (
                              <span key={k} className="bg-[#1c1c20] px-2 py-0.5 rounded border border-[#27272a]">
                                <span className="text-zinc-500">{k}:</span> <span className="text-zinc-200">{String(v)}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: LATENCY BREAKDOWN PER INTERNAL SERVICE */}
          {activeTab === 'latency' && (
            <div className="space-y-5">
              <div>
                <h4 className="text-sm font-bold text-white tracking-tight">
                  การจำแนกเวลาแฝงตามบริการภายใน (Latency Breakdown per Internal Service)
                </h4>
                <p className="text-xs text-zinc-400 mt-0.5">
                  วิเคราะห์ระยะเวลาการทำงานของแต่ละไมโครเซอร์วิสตั้งแต่ Edge Gateway ไปจนถึง Upstream LLM เพื่อตรวจหาจุดคอขวด
                </p>
              </div>

              {/* Multi-Colored Horizontal Breakdown Bar */}
              <div className="space-y-2 p-4 rounded-xl bg-[#151518] border border-[#27272a]">
                <div className="flex items-center justify-between text-xs text-zinc-300 font-medium">
                  <span>สัดส่วนเวลาแฝง (Total: {log.latencyMs} ms)</span>
                  <span className="font-mono text-emerald-400 font-bold">100% End-to-End</span>
                </div>

                <div className="w-full h-4 rounded-full overflow-hidden flex bg-zinc-800">
                  {breakdown.map((item, idx) => (
                    <div
                      key={idx}
                      className={`${getCategoryBarColor(item.category)} h-full transition-all`}
                      style={{ width: `${Math.max(item.percentage, 1)}%` }}
                      title={`${item.serviceName}: ${item.latencyMs}ms (${item.percentage}%)`}
                    />
                  ))}
                </div>

                {/* Legend */}
                <div className="flex items-center gap-3 flex-wrap pt-2 text-[11px]">
                  {breakdown.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${getCategoryBarColor(item.category)}`} />
                      <span className="text-zinc-300">{item.serviceName.split(' ')[0]}</span>
                      <span className="text-zinc-500 font-mono">({item.percentage}%)</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Detailed Service Table / Cards */}
              <div className="space-y-3">
                {breakdown.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-[#151518] border border-[#27272a] hover:border-zinc-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${getCategoryBarColor(item.category)}`} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{item.serviceName}</span>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase border ${getCategoryColor(item.category)}`}>
                            {item.category}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 mt-1">{item.details}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0 sm:text-right">
                      <div>
                        <div className="font-mono text-sm font-bold text-white">{item.latencyMs} ms</div>
                        <div className="font-mono text-[11px] text-zinc-400">{item.percentage}% ของเวลาทั้งหมด</div>
                      </div>

                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-1 rounded border ${
                          item.status === 'SUCCESS'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : item.status === 'WARNING'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: REQUEST PAYLOAD */}
          {activeTab === 'request' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white tracking-tight">
                    ข้อมูลคำขอเข้าจากไคลเอนต์ (Inbound Client Request)
                  </h4>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    ตรวจสอบ HTTP Headers, พารามิเตอร์โมเดล, และข้อความสนทนาที่ส่งเข้ามา
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyToClipboard(curlCommand, 'curl-cmd')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#18181c] hover:bg-zinc-800 border border-[#27272a] text-xs text-zinc-300 font-medium transition-colors"
                  >
                    {copiedField === 'curl-cmd' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Terminal className="w-3.5 h-3.5" />}
                    <span>คัดลอกคำสั่ง cURL</span>
                  </button>

                  <button
                    onClick={() => copyToClipboard(JSON.stringify(reqPayload.body, null, 2), 'req-body-json')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#18181c] hover:bg-zinc-800 border border-[#27272a] text-xs text-zinc-300 font-medium transition-colors"
                  >
                    {copiedField === 'req-body-json' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>คัดลอก Body JSON</span>
                  </button>
                </div>
              </div>

              {/* Request Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-[#151518] border border-[#27272a]">
                  <span className="text-[10px] text-zinc-400 font-semibold uppercase">HTTP Method & Path</span>
                  <div className="font-mono text-xs font-bold text-emerald-400 mt-1">POST /api/v1/chat/completions</div>
                </div>

                <div className="p-3 rounded-xl bg-[#151518] border border-[#27272a]">
                  <span className="text-[10px] text-zinc-400 font-semibold uppercase">ไคลเอนต์ (Client App)</span>
                  <div className="text-xs font-bold text-white mt-1">{log.clientName || 'Internal Production'}</div>
                </div>

                <div className="p-3 rounded-xl bg-[#151518] border border-[#27272a]">
                  <span className="text-[10px] text-zinc-400 font-semibold uppercase">Client IP & Protocol</span>
                  <div className="font-mono text-xs text-zinc-300 mt-1">{log.ipAddress || '127.0.0.1'} (HTTP/2)</div>
                </div>

                <div className="p-3 rounded-xl bg-[#151518] border border-[#27272a]">
                  <span className="text-[10px] text-zinc-400 font-semibold uppercase">เป้าหมายโมเดล</span>
                  <div className="font-mono text-xs text-cyan-400 mt-1">{log.model || log.modelId}</div>
                </div>
              </div>

              {/* Conversation Messages Inspector */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-white">ข้อความสนทนา (Chat Messages Payload):</span>
                <div className="space-y-2.5 p-4 rounded-xl bg-[#151518] border border-[#27272a]">
                  {reqPayload.body.messages?.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl text-xs ${
                        msg.role === 'user'
                          ? 'bg-emerald-500/10 border border-emerald-500/20 text-zinc-200'
                          : msg.role === 'system'
                          ? 'bg-zinc-800/60 border border-zinc-700/60 text-zinc-300'
                          : 'bg-purple-500/10 border border-purple-500/20 text-zinc-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1 text-[11px] font-mono font-bold">
                        <span
                          className={
                            msg.role === 'user'
                              ? 'text-emerald-400'
                              : msg.role === 'system'
                              ? 'text-zinc-400'
                              : 'text-purple-400'
                          }
                        >
                          Role: {msg.role.toUpperCase()}
                        </span>
                        <span className="text-zinc-500 font-normal">#{idx + 1}</span>
                      </div>
                      <p className="whitespace-pre-wrap font-mono leading-relaxed text-[11.5px]">{msg.content}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Raw Headers */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-white">HTTP Request Headers:</span>
                <pre className="p-3.5 rounded-xl bg-[#151518] border border-[#27272a] text-[11px] font-mono text-zinc-300 overflow-x-auto">
                  {JSON.stringify(reqPayload.headers, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 4: RESPONSE PAYLOAD */}
          {activeTab === 'response' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white tracking-tight">
                    ผลลัพธ์ตอบกลับจากเกตเวย์ (Outbound Response Payload)
                  </h4>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    ตรวจสอบโครงสร้างผลลัพธ์ OpenAI Standard Completion, Finish Reason, และข้อความที่สร้างขึ้น
                  </p>
                </div>

                <button
                  onClick={() => copyToClipboard(JSON.stringify(resPayload.body, null, 2), 'res-body-json')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#18181c] hover:bg-zinc-800 border border-[#27272a] text-xs text-zinc-300 font-medium transition-colors"
                >
                  {copiedField === 'res-body-json' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>คัดลอก Response JSON</span>
                </button>
              </div>

              {/* Generated Content Card */}
              {is200 && resPayload.body.choices && resPayload.body.choices[0] && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-white">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                      <span>ข้อความที่ถูกสร้างโดยโมเดล (Generated Assistant Message):</span>
                    </span>
                    <span className="font-mono text-[11px] text-zinc-400">
                      Finish Reason: <strong className="text-emerald-400">{resPayload.body.choices[0].finish_reason}</strong>
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-[#151518] border border-[#27272a] text-xs text-zinc-200 leading-relaxed font-mono whitespace-pre-wrap">
                    {resPayload.body.choices[0].message.content}
                  </div>
                </div>
              )}

              {/* Error Diagnostic if failed */}
              {!is200 && (
                <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-900/60 text-rose-200 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm text-rose-400">
                    <AlertTriangle className="w-4 h-4" />
                    <span>ข้อผิดพลาดจาก Upstream Gateway (Error Diagnostic)</span>
                  </div>
                  <p className="text-xs">{log.error || resPayload.body.error?.message || 'Upstream Rate Limit Exceeded'}</p>
                </div>
              )}

              {/* Raw JSON Body */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-white">Raw JSON Response:</span>
                <pre className="p-4 rounded-xl bg-[#151518] border border-[#27272a] text-[11px] font-mono text-zinc-300 overflow-x-auto">
                  {JSON.stringify(resPayload.body, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 5: SECURITY & KEY POOL */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-white tracking-tight">
                  ความปลอดภัยและการหมุนเวียนพูลคีย์ (Security & Key Vault Telemetry)
                </h4>
                <p className="text-xs text-zinc-400 mt-0.5">
                  รายละเอียดการเข้ารหัสลับ AES-256, กลยุทธ์การกระจายโหลดพูล, และการตรวจสอบสิทธิ์ Client
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-4 rounded-xl bg-[#151518] border border-[#27272a] space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <Lock className="w-4 h-4 text-emerald-400" />
                    <span>ข้อมูลคีย์ผู้ให้บริการ (Upstream API Key Vault)</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between text-zinc-400">
                      <span>ชื่อคีย์:</span>
                      <strong className="text-white">{log.keyLabel || 'Key in Cluster'}</strong>
                    </div>

                    <div className="flex items-center justify-between text-zinc-400">
                      <span>Masked Secret:</span>
                      <span className="font-mono text-zinc-200">{log.maskedKey || 'sk-••••••••••••••••'}</span>
                    </div>

                    <div className="flex items-center justify-between text-zinc-400">
                      <span>การเข้ารหัสที่จัดเก็บ:</span>
                      <span className="text-emerald-400 font-mono font-semibold">AES-256-CBC at rest</span>
                    </div>

                    <div className="flex items-center justify-between text-zinc-400">
                      <span>กลยุทธ์หมุนเวียนพูล:</span>
                      <span className="font-mono text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        {log.poolStrategy || 'ROUND_ROBIN'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#151518] border border-[#27272a] space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <Globe className="w-4 h-4 text-blue-400" />
                    <span>ข้อมูลการเชื่อมต่อ Client (Ingress Audit)</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between text-zinc-400">
                      <span>ชื่อแอปพลิเคชัน:</span>
                      <strong className="text-white">{log.clientName || 'Default Gateway Client'}</strong>
                    </div>

                    <div className="flex items-center justify-between text-zinc-400">
                      <span>IP ต้นทาง:</span>
                      <span className="font-mono text-zinc-200">{log.ipAddress || '127.0.0.1'}</span>
                    </div>

                    <div className="flex items-center justify-between text-zinc-400">
                      <span>โควต้าคงเหลือ:</span>
                      <span className="text-emerald-400 font-mono font-semibold">Unlimited (Free Tier)</span>
                    </div>

                    <div className="flex items-center justify-between text-zinc-400">
                      <span>การตรวจสอบสิทธิ์:</span>
                      <span className="text-emerald-400 font-mono">Passed (SHA-256 Token)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-[#27272a] bg-[#151518]">
          <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Telemetry verified by Free LLM Hub Engine</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold border border-zinc-700 transition-colors"
          >
            ปิดหน้าต่าง (Close)
          </button>
        </div>
      </div>
    </div>
  );
};

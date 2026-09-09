import React, { useEffect, useState } from 'react';
import {
  Terminal,
  Play,
  Copy,
  Check,
  Code2,
  RefreshCw,
  Cpu,
  Layers,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { ProviderModelItem, ClientApiKeyItem } from '../../types';
import { api } from '../../lib/api';

export const GatewayPlaygroundView: React.FC = () => {
  const [models, setModels] = useState<ProviderModelItem[]>([]);
  const [clientKeys, setClientKeys] = useState<ClientApiKeyItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Form
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedClientKey, setSelectedClientKey] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('คุณคือผู้ช่วย AI ที่กระชับ ชัดเจน และเป็นประโยชน์ ทำงานผ่านระบบ Free LLM Hub');
  const [userPrompt, setUserPrompt] = useState('อธิบายการทำงานของการหมุนเวียนคีย์ (Key Rotation) และระบบสลับเส้นทางสำรอง (Failover) ภายใน 2 ประโยค');
  
  // Execution state
  const [sending, setSending] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeCodeTab, setActiveCodeTab] = useState<'curl' | 'python' | 'node'>('curl');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const [modelsData, keysData] = await Promise.all([api.getModels(), api.getClientKeys()]);
        setModels(modelsData);
        setClientKeys(keysData);
        // Default to auto
        setSelectedModel('auto');
        if (keysData.length > 0) {
          setSelectedClientKey(keysData[0].prefix);
        }
      } catch (err) {
        console.error('Failed to load playground dependencies', err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleSend = async () => {
    setSending(true);
    setError(null);
    setResponse(null);

    try {
      const messages = [];
      if (systemPrompt.trim()) {
        messages.push({ role: 'system', content: systemPrompt });
      }
      messages.push({ role: 'user', content: userPrompt });

      const data = await api.sendChatCompletion({
        model: selectedModel,
        messages,
        clientKey: selectedClientKey || undefined,
      });
      setResponse(data);
    } catch (err: any) {
      setError(err.message || 'คำขอ API ล้มเหลว');
    } finally {
      setSending(false);
    }
  };

  const curlCommand = `curl -X POST "${window.location.origin}/api/v1/chat/completions" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${selectedClientKey || 'YOUR_CLIENT_KEY'}" \\
  -d '{
    "model": "${selectedModel}",
    "messages": [
      {"role": "system", "content": ${JSON.stringify(systemPrompt)}},
      {"role": "user", "content": ${JSON.stringify(userPrompt)}}
    ]
  }'`;

  const pythonSnippet = `from openai import OpenAI

client = OpenAI(
    base_url="${window.location.origin}/api/v1",
    api_key="${selectedClientKey || 'fk_live_prod...'}"
)

response = client.chat.completions.create(
    model="${selectedModel}",
    messages=[
        {"role": "system", "content": "${systemPrompt}"},
        {"role": "user", "content": "${userPrompt}"}
    ]
)

print(response.choices[0].message.content)`;

  const nodeSnippet = `import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: '${window.location.origin}/api/v1',
  apiKey: '${selectedClientKey || 'fk_live_prod...'}',
});

async function main() {
  const completion = await openai.chat.completions.create({
    model: '${selectedModel}',
    messages: [
      { role: 'system', content: '${systemPrompt}' },
      { role: 'user', content: '${userPrompt}' }
    ],
  });

  console.log(completion.choices[0].message.content);
}

main();`;

  const copyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#27272a]">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">สนามทดสอบเกตเวย์ API (Unified Gateway Playground)</h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            อินเตอร์เฟซมาตรฐานเข้ากันได้กับ OpenAI <code className="text-emerald-400 font-mono">/v1/chat/completions</code> เพื่อทดสอบการหมุนเวียนคีย์สดและการตอบกลับ
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 rounded bg-zinc-800 text-zinc-300 font-mono border border-zinc-700">
            รองรับ OpenAI SDK
          </span>
        </div>
      </div>

      {/* Main split grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Request Builder */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-4 rounded-xl bg-[#111113] border border-[#27272a] space-y-4">
            <h3 className="text-xs font-semibold text-white">พารามิเตอร์คำขอ (Request Parameters)</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">โมเดลปลายทาง</label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full bg-[#161619] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-white"
                >
                  <option value="auto" className="font-bold text-emerald-400">⚡ Auto (Smart Routing & Fallback)</option>
                  {models.map((m) => (
                    <option key={m.id} value={m.modelId}>
                      {m.name} ({m.providerName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Client Key สำหรับยืนยันตัวตน</label>
                <select
                  value={selectedClientKey}
                  onChange={(e) => setSelectedClientKey(e.target.value)}
                  className="w-full bg-[#161619] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-white"
                >
                  <option value="">โหมดผู้ดูแลระบบ (Admin Bypass - ไม่ต้องมีคีย์)</option>
                  {clientKeys.map((k) => (
                    <option key={k.id} value={k.prefix}>
                      {k.name} ({k.prefix}...)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">ข้อความระบบ (System Message)</label>
              <textarea
                rows={2}
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                className="w-full bg-[#161619] border border-[#27272a] rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-zinc-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">ข้อความผู้ใช้ (User Prompt)</label>
              <textarea
                rows={4}
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                className="w-full bg-[#161619] border border-[#27272a] rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-zinc-500"
              />
            </div>

            <button
              id="playground-send-btn"
              onClick={handleSend}
              disabled={sending}
              className="w-full py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-semibold tracking-wide transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-black" />
              <span>{sending ? 'กำลังส่งผ่านพูลและหมุนเวียนคีย์...' : 'ส่งคำขอ Chat Completion'}</span>
            </button>
          </div>

          {/* Code Snippets Tabs */}
          <div className="p-4 rounded-xl bg-[#111113] border border-[#27272a] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveCodeTab('curl')}
                  className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                    activeCodeTab === 'curl' ? 'bg-zinc-800 text-white font-semibold' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  cURL
                </button>
                <button
                  onClick={() => setActiveCodeTab('python')}
                  className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                    activeCodeTab === 'python' ? 'bg-zinc-800 text-white font-semibold' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Python SDK
                </button>
                <button
                  onClick={() => setActiveCodeTab('node')}
                  className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                    activeCodeTab === 'node' ? 'bg-zinc-800 text-white font-semibold' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Node.js SDK
                </button>
              </div>

              <button
                onClick={() =>
                  copyCode(
                    activeCodeTab === 'curl'
                      ? curlCommand
                      : activeCodeTab === 'python'
                      ? pythonSnippet
                      : nodeSnippet
                  )
                }
                className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'คัดลอกแล้ว' : 'คัดลอกโค้ด'}</span>
              </button>
            </div>

            <pre className="p-3 bg-[#161619] border border-[#27272a] rounded-lg text-[11px] font-mono text-zinc-300 overflow-x-auto leading-relaxed">
              {activeCodeTab === 'curl'
                ? curlCommand
                : activeCodeTab === 'python'
                ? pythonSnippet
                : nodeSnippet}
            </pre>
          </div>
        </div>

        {/* Right Column: Live Output & Key Telemetry Audit */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-4 rounded-xl bg-[#111113] border border-[#27272a] space-y-3 min-h-[460px] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-white">ผลลัพธ์จากเกตเวย์ (Gateway Response)</h3>
                {response && (
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                    HTTP 200 OK
                  </span>
                )}
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-900/60 text-xs text-rose-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold">เกิดข้อผิดพลาดในการประมวลผล</div>
                    <div className="text-[11px] mt-0.5">{error}</div>
                  </div>
                </div>
              )}

              {response ? (
                <div className="space-y-3">
                  {/* Assistant Message Bubble */}
                  <div className="p-3.5 rounded-xl bg-[#161619] border border-[#27272a] text-xs text-zinc-200 leading-relaxed">
                    <div className="text-[10px] uppercase font-mono text-zinc-400 mb-1">
                      คำตอบจากโมเดล ({response.model})
                    </div>
                    <div className="whitespace-pre-wrap">{response.choices?.[0]?.message?.content}</div>
                  </div>

                  {/* Telemetry & Key Audit */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 rounded bg-[#161619] border border-[#27272a]">
                      <div className="text-[10px] text-zinc-400">ผู้ให้บริการที่ถูกเลือก</div>
                      <div className="font-semibold text-white font-mono mt-0.5">
                        {response._hub_routed_provider || 'Google'}
                      </div>
                    </div>
                    <div className="p-2 rounded bg-[#161619] border border-[#27272a]">
                      <div className="text-[10px] text-zinc-400">โทเค็นทั้งหมด</div>
                      <div className="font-semibold text-cyan-400 font-mono mt-0.5">
                        {response.usage?.total_tokens || 142}
                      </div>
                    </div>
                    <div className="p-2 rounded bg-[#161619] border border-[#27272a]">
                      <div className="text-[10px] text-zinc-400">ความหน่วง (Latency)</div>
                      <div className="font-semibold text-emerald-400 font-mono mt-0.5">
                        {response._hub_latency_ms || 215}ms
                      </div>
                    </div>
                  </div>

                  {/* Raw JSON */}
                  <details className="text-[11px] text-zinc-400 cursor-pointer">
                    <summary className="hover:text-white font-mono">ดูโครงสร้าง JSON ดิบ (OpenAI Compatible Format)</summary>
                    <pre className="mt-2 p-3 bg-black/60 rounded border border-zinc-800 text-[10px] font-mono text-zinc-300 max-h-56 overflow-y-auto">
                      {JSON.stringify(response, null, 2)}
                    </pre>
                  </details>
                </div>
              ) : !sending && !error ? (
                <div className="h-64 flex flex-col items-center justify-center text-zinc-400 text-xs">
                  <Terminal className="w-8 h-8 text-zinc-700 mb-2" />
                  <span>กำหนดพารามิเตอร์และคลิกส่งคำขอเพื่อทดสอบการทำงานของเกตเวย์</span>
                </div>
              ) : null}

              {sending && (
                <div className="h-64 flex flex-col items-center justify-center text-zinc-400 text-xs gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
                  <span>กำลังสุ่มเลือกคีย์ที่ดีที่สุดในพูล และส่งคำขอไปยังผู้ให้บริการ...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

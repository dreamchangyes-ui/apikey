import React from 'react';
import { useDisplay } from '../../context/DisplayContext';
import { FileCode2, Copy, BookOpen, Search, Code, Check } from 'lucide-react';

export const ApiDocsView: React.FC = () => {
  const { textScaleClass } = useDisplay();
  const [copied, setCopied] = React.useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const endpointUrl = `${window.location.origin}/api/v1/chat/completions`;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="pb-4 border-b border-[#27272a]">
        <h1 className={`${textScaleClass.heading} text-white tracking-tight flex items-center gap-2`}>
          <BookOpen className="w-5 h-5 text-emerald-400" />
          เอกสารอ้างอิง API (API Documentation)
        </h1>
        <p className={`${textScaleClass.subheading} mt-1 text-zinc-400`}>
          คู่มือการใช้งาน Unified API สำหรับเชื่อมต่อโมเดล AI และใช้งานระบบสลับโมเดลอัตโนมัติ (Auto Fallback)
        </p>
      </div>

      <div className="space-y-6">
        {/* Base URL */}
        <section className="bg-[#121215] border border-[#27272a] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[#27272a] bg-[#151518]">
            <h2 className="text-sm font-semibold text-white">Endpoint URL & Authentication</h2>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <p className="text-xs text-zinc-400 mb-2">Base URL สำหรับการเรียกใช้งานแชทโมเดล</p>
              <div className="flex items-center gap-2 bg-black border border-zinc-800 rounded-lg p-2.5">
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-1.5 py-0.5 rounded uppercase">POST</span>
                <code className="text-sm text-zinc-300 font-mono flex-1 select-all">{endpointUrl}</code>
                <button 
                  onClick={() => handleCopy(endpointUrl, 'url')}
                  className="p-1.5 text-zinc-500 hover:text-white transition-colors bg-zinc-900 rounded"
                >
                  {copied === 'url' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            
            <div>
              <p className="text-xs text-zinc-400 mb-2">การยืนยันตัวตน (Authentication)</p>
              <p className="text-sm text-zinc-300">
                ส่ง Client API Key ไปใน HTTP Header <code className="bg-zinc-800 px-1 rounded text-emerald-300">Authorization: Bearer YOUR_API_KEY</code>
              </p>
            </div>
          </div>
        </section>

        {/* Auto Model Fallback */}
        <section className="bg-[#121215] border border-emerald-500/30 rounded-xl overflow-hidden shadow-[0_0_15px_rgba(16,185,129,0.05)]">
          <div className="p-4 border-b border-[#27272a] bg-[#151518] flex items-center gap-2">
            <Search className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-white">การใช้ระบบสลับโมเดลอัตโนมัติ (Auto Model Fallback)</h2>
          </div>
          <div className="p-4">
            <p className="text-sm text-zinc-300 leading-relaxed mb-4">
              หากต้องการให้ระบบใช้ <strong>Smart Routing & Fallback</strong> (เมื่อโมเดลหลักมีปัญหา จะเปลี่ยนไปใช้โมเดลสำรองให้อัตโนมัติแบบไร้รอยต่อ) 
              คุณ <strong className="text-white">ต้องระบุชื่อโมเดลเป็น <code>"auto"</code> เท่านั้น</strong>
            </p>
            <p className="text-xs text-zinc-400 mb-3 italic">
              * หมายเหตุ: หากคุณระบุชื่อโมเดลเฉพาะเจาะจง (เช่น <code>"gemini-2.5-flash"</code>) ระบบจะเรียกใช้งานแค่โมเดลนั้นและ <strong>ไม่ทำการสลับไปโมเดลอื่น</strong> หากเกิดข้อผิดพลาด
            </p>

            <div className="bg-black border border-zinc-800 rounded-lg p-3">
              <pre className="text-xs font-mono text-zinc-300 overflow-x-auto">
{`{
  "model": "auto", // ระบุว่า 'auto' เพื่อเปิดใช้โหมดสลับโมเดลสำรอง
  "messages": [
    { "role": "system", "content": "You are a helpful assistant." },
    { "role": "user", "content": "Hello!" }
  ]
}`}
              </pre>
            </div>
          </div>
        </section>

        {/* Example cURL */}
        <section className="bg-[#121215] border border-[#27272a] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[#27272a] bg-[#151518] flex items-center gap-2">
            <FileCode2 className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-semibold text-white">ตัวอย่างคำสั่ง cURL (cURL Example)</h2>
          </div>
          <div className="p-4 relative group">
            <button 
              onClick={() => handleCopy(`curl -X POST ${endpointUrl} \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "model": "auto",
    "messages": [{"role": "user", "content": "What is AI?"}]
  }'`, 'curl')}
              className="absolute top-4 right-4 p-1.5 bg-zinc-800 text-zinc-400 hover:text-white rounded transition-colors opacity-0 group-hover:opacity-100"
            >
              {copied === 'curl' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <pre className="text-xs font-mono text-zinc-300 overflow-x-auto whitespace-pre-wrap">
{`curl -X POST ${endpointUrl} \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "model": "auto",
    "messages": [{"role": "user", "content": "What is AI?"}]
  }'`}
            </pre>
          </div>
        </section>

        {/* Response Format */}
        <section className="bg-[#121215] border border-[#27272a] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[#27272a] bg-[#151518] flex items-center gap-2">
            <Code className="w-4 h-4 text-purple-400" />
            <h2 className="text-sm font-semibold text-white">รูปแบบการตอบกลับ (Response Format)</h2>
          </div>
          <div className="p-4">
            <p className="text-xs text-zinc-400 mb-3">
              ระบบใช้รูปแบบเดียวกับ OpenAI API ทำให้คุณสามารถใช้ไลบรารี OpenAI 
              หรือไลบรารีมาตรฐานอื่นๆ เชื่อมต่อได้ทันที
            </p>
            <div className="bg-black border border-zinc-800 rounded-lg p-3">
              <pre className="text-xs font-mono text-zinc-300 overflow-x-auto">
{`{
  "id": "chatcmpl-12345",
  "object": "chat.completion",
  "created": 1677652288,
  "model": "gemini-2.5-flash", // ชื่อโมเดลที่ระบบเลือกใช้งานจริง
  "choices": [{
    "index": 0,
    "message": {
      "role": "assistant",
      "content": "AI stands for Artificial Intelligence..."
    },
    "finish_reason": "stop"
  }],
  "usage": {
    "prompt_tokens": 12,
    "completion_tokens": 18,
    "total_tokens": 30
  }
}`}
              </pre>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

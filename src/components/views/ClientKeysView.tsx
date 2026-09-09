import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Plus,
  Copy,
  Check,
  Trash2,
  RotateCw,
  RefreshCw,
  AlertTriangle,
  Lock,
  Layers,
  X,
} from 'lucide-react';
import { ClientApiKeyItem, ProviderModelItem, UserRole } from '../../types';
import { api } from '../../lib/api';
import { useDisplay } from '../../context/DisplayContext';
import { GoogleSheetsToolbar } from '../common/GoogleSheetsToolbar';

interface ClientKeysViewProps {
  userRole: UserRole;
}

export const ClientKeysView: React.FC<ClientKeysViewProps> = ({ userRole }) => {
  const { textScaleClass, sheetMode } = useDisplay();
  const [keys, setKeys] = useState<ClientApiKeyItem[]>([]);
  const [models, setModels] = useState<ProviderModelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // New Key Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [reqLimit, setReqLimit] = useState(5000);
  const [tokenLimit, setTokenLimit] = useState(5000000);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);

  // One-time Copy Secret Modal
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [keysData, modelsData] = await Promise.all([api.getClientKeys(), api.getModels()]);
      setKeys(keysData);
      setModels(modelsData);
    } catch (err) {
      console.error('Failed to load client keys', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userRole === 'VIEWER') return;

    try {
      const res = await api.createClientKey({
        name,
        reqLimitDaily: reqLimit,
        tokenLimitDaily: tokenLimit,
        allowedModels: selectedModels.length > 0 ? selectedModels : undefined,
      });

      // Show one-time secret
      setCreatedSecret((res as any).rawKeyOnce || (res as any).prefix);
      setIsModalOpen(false);
      setName('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error generating key');
    }
  };

  const handleRevoke = async (id: string) => {
    if (userRole !== 'ADMIN') return;
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการเพิกถอน Client Key นี้? แอปรองที่ใช้คีย์นี้อยู่จะถูกปฏิเสธทันที'))
      return;

    try {
      await api.revokeClientKey(id);
      loadData();
    } catch (err) {
      console.error('Failed to revoke key', err);
    }
  };

  const handleRotate = async (id: string) => {
    if (userRole === 'VIEWER') return;
    try {
      const res = await api.rotateClientKey(id);
      setCreatedSecret(res.rawKeyOnce);
      loadData();
    } catch (err) {
      console.error('Failed to rotate client key', err);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleModelSelection = (modelId: string) => {
    if (selectedModels.includes(modelId)) {
      setSelectedModels(selectedModels.filter((m) => m !== modelId));
    } else {
      setSelectedModels([...selectedModels, modelId]);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#27272a]">
        <div>
          <h1 className={`${textScaleClass.heading} text-white tracking-tight`}>
            คีย์เข้าถึงสำหรับผู้ใช้ภายนอก (Client Keys)
          </h1>
          <p className={`${textScaleClass.subheading} mt-0.5`}>
            โทเค็น API ภายในสำหรับแอปพลิเคชันปลายทาง, ระบบหลังบ้าน, ควบคุมโควต้าคำขอ และรายการโมเดลที่อนุญาต
          </p>
        </div>

        <div className="flex items-center gap-2">
          {userRole !== 'VIEWER' && (
            <button
              id="client-keys-create-btn"
              onClick={() => {
                setSelectedModels(models.map((m) => m.modelId));
                setIsModalOpen(true);
              }}
              className={`flex items-center gap-1.5 rounded-lg bg-white hover:bg-zinc-200 text-black font-semibold transition-colors ${textScaleClass.btn}`}
            >
              <Plus className="w-4 h-4" />
              <span>สร้าง Client Key ใหม่</span>
            </button>
          )}

          <button
            onClick={loadData}
            className="p-2 rounded-lg bg-[#111113] hover:bg-zinc-800 text-zinc-400 hover:text-white border border-[#27272a] transition-colors"
            title="รีเฟรช Client Keys"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Google Sheets Control Toolbar */}
      <GoogleSheetsToolbar
        title="=QUERY(CLIENT_KEYS, &quot;SELECT NAME, PREFIX, LIMITS, STATUS WHERE STATUS='ACTIVE'&quot;)"
        totalRows={keys.length}
        onSyncFreeModels={async () => {
          try {
            setIsSyncing(true);
            const res = await api.syncFreeModels();
            alert(res.message);
            await loadData();
          } catch (e: any) {
            alert(e.message || 'ซิงค์ไม่สำเร็จ');
          } finally {
            setIsSyncing(false);
          }
        }}
        isSyncing={isSyncing}
      />

      {/* Gateway Usage Snippet */}
      <div className="p-3.5 rounded-xl bg-[#111113] border border-[#27272a] flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="space-y-1">
          <div className="font-semibold text-white flex items-center gap-2">
            <span>เฮดเดอร์ยืนยันตัวตนสำหรับเกตเวย์กลาง (Header Auth)</span>
            <span className="text-[10px] font-mono bg-zinc-800 text-zinc-300 px-1.5 py-0.2 rounded">
              RFC 6750
            </span>
          </div>
          <p className="text-zinc-400 text-[11px]">
            ส่งคีย์นี้ในเฮดเดอร์ <code className="text-zinc-300">Authorization: Bearer &lt;CLIENT_KEY&gt;</code> เพื่อเข้าถึงทุกโมเดลผ่าน <code className="text-emerald-400">/api/v1/chat/completions</code>
          </p>
        </div>
      </div>

      {/* Client Keys Table */}
      <div
        className={`overflow-x-auto rounded-xl border border-[#27272a] bg-[#111113] shadow-md ${
          sheetMode ? 'divide-y divide-[#27272a]' : ''
        }`}
      >
        <table className={`w-full text-left border-collapse whitespace-nowrap ${sheetMode ? 'border border-[#27272a]' : ''}`}>
          <thead>
            {/* Sheet Column Alphabets */}
            {sheetMode && (
              <tr className="bg-[#1a1a1d] text-zinc-500 font-mono text-[10px] uppercase border-b border-[#27272a] select-none">
                <th className="py-1 px-3 w-12 text-center border-r border-[#27272a] bg-[#141416]">#</th>
                <th className="py-1 px-4 border-r border-[#27272a]">A • APP NAME</th>
                <th className="py-1 px-4 border-r border-[#27272a]">B • KEY PREFIX</th>
                <th className="py-1 px-4 border-r border-[#27272a]">C • DAILY REQUESTS</th>
                <th className="py-1 px-4 border-r border-[#27272a]">D • DAILY TOKENS</th>
                <th className="py-1 px-4 border-r border-[#27272a]">E • ALLOWED MODELS</th>
                <th className="py-1 px-4 border-r border-[#27272a]">F • STATUS</th>
                <th className="py-1 px-4 border-r border-[#27272a]">G • LAST USED</th>
                <th className="py-1 px-4 text-right">H • ACTIONS</th>
              </tr>
            )}

            <tr className={`border-b border-[#27272a] bg-[#161619] text-zinc-300 ${textScaleClass.th}`}>
              {sheetMode && (
                <th className="py-3 px-3 w-12 text-center font-mono text-zinc-500 border-r border-[#27272a]">
                  ลำดับ
                </th>
              )}
              <th className={`py-3 px-4 ${sheetMode ? 'border-r border-[#27272a]' : ''}`}>ชื่อแอปพลิเคชัน</th>
              <th className={`py-3 px-4 ${sheetMode ? 'border-r border-[#27272a]' : ''}`}>รหัสโทเค็น (Prefix)</th>
              <th className={`py-3 px-4 ${sheetMode ? 'border-r border-[#27272a]' : ''}`}>ลิมิตคำขอรายวัน</th>
              <th className={`py-3 px-4 ${sheetMode ? 'border-r border-[#27272a]' : ''}`}>ลิมิตโทเค็นรายวัน</th>
              <th className={`py-3 px-4 ${sheetMode ? 'border-r border-[#27272a]' : ''}`}>โมเดลที่อนุญาต</th>
              <th className={`py-3 px-4 ${sheetMode ? 'border-r border-[#27272a]' : ''}`}>สถานะ</th>
              <th className={`py-3 px-4 ${sheetMode ? 'border-r border-[#27272a]' : ''}`}>ใช้งานล่าสุด</th>
              <th className="py-3 px-4 text-right">การจัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#27272a]">
            {keys.map((k, idx) => (
              <tr
                key={k.id}
                className={`transition-colors hover:bg-zinc-800/20 ${
                  idx % 2 === 1 && sheetMode ? 'bg-[#141416]/60' : 'bg-transparent'
                }`}
              >
                {/* Sheet Row Index */}
                {sheetMode && (
                  <td className="py-3 px-3 w-12 text-center font-mono text-zinc-500 text-xs border-r border-[#27272a] bg-[#141416]/40 select-none">
                    {idx + 1}
                  </td>
                )}

                <td className={`py-3 px-4 font-semibold text-white ${sheetMode ? 'border-r border-[#27272a]' : ''}`}>
                  {k.name}
                </td>

                <td className={`py-3 px-4 ${sheetMode ? 'border-r border-[#27272a]' : ''}`}>
                  <span className="font-mono text-zinc-300 bg-[#161619] px-2 py-1 rounded border border-[#27272a]">
                    {k.prefix}••••••••
                  </span>
                </td>

                <td className={`py-3 px-4 font-mono text-zinc-300 ${sheetMode ? 'border-r border-[#27272a]' : ''}`}>
                  {k.reqLimitDaily.toLocaleString()} คำขอ
                </td>

                <td className={`py-3 px-4 font-mono text-zinc-300 ${sheetMode ? 'border-r border-[#27272a]' : ''}`}>
                  {(k.tokenLimitDaily / 1000000).toFixed(1)}M โทเค็น
                </td>

                <td className={`py-3 px-4 ${sheetMode ? 'border-r border-[#27272a]' : ''}`}>
                  {k.allowedModels.length === 0 ? (
                    <span className="text-zinc-400">ทุกโมเดล</span>
                  ) : (
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {k.allowedModels.slice(0, 2).map((m) => (
                        <span
                          key={m}
                          className="px-1.5 py-0.2 rounded bg-zinc-800 text-[10px] text-zinc-300 font-mono"
                        >
                          {m.split('/').pop()}
                        </span>
                      ))}
                      {k.allowedModels.length > 2 && (
                        <span className="text-[10px] text-zinc-400">+{k.allowedModels.length - 2}</span>
                      )}
                    </div>
                  )}
                </td>

                <td className={`py-3 px-4 ${sheetMode ? 'border-r border-[#27272a]' : ''}`}>
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                      k.status === 'ACTIVE'
                        ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/40'
                        : 'bg-rose-950/60 text-rose-400 border-rose-800/40'
                    }`}
                  >
                    {k.status === 'ACTIVE' ? 'เปิดใช้งาน' : 'เพิกถอนแล้ว'}
                  </span>
                </td>

                <td className={`py-3 px-4 text-zinc-400 text-[11px] ${sheetMode ? 'border-r border-[#27272a]' : ''}`}>
                  {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString('th-TH') : 'ไม่เคย'}
                </td>

                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {userRole !== 'VIEWER' && (
                      <button
                        onClick={() => handleRotate(k.id)}
                        className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                        title="หมุนเวียนคีย์ความลับใหม่"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {userRole === 'ADMIN' && (
                      <button
                        onClick={() => handleRevoke(k.id)}
                        className="p-1.5 rounded text-rose-400 hover:text-rose-200 hover:bg-rose-950/40 transition-colors"
                        title="เพิกถอนคีย์"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#111113] border border-[#27272a] rounded-2xl p-6 shadow-2xl relative text-left max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-base font-semibold text-white mb-2">ออก Client Key ใหม่</h2>
            <p className="text-xs text-zinc-400 mb-4">
              ให้อนุญาตแอปพลิเคชันหรือบริการภายนอกเข้าใช้งานคลัสเตอร์ AI พูล
            </p>

            <form onSubmit={handleCreateKey} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">ชื่อแอปพลิเคชัน / ลูกค้า</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น Next.js SaaS Chatbot"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#161619] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">โควต้าคำขอรายวัน</label>
                  <input
                    type="number"
                    value={reqLimit}
                    onChange={(e) => setReqLimit(Number(e.target.value))}
                    className="w-full bg-[#161619] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">โควต้าโทเค็นรายวัน</label>
                  <input
                    type="number"
                    value={tokenLimit}
                    onChange={(e) => setTokenLimit(Number(e.target.value))}
                    className="w-full bg-[#161619] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  รายการโมเดลที่อนุญาต (เลือกแล้ว {selectedModels.length} รายการ)
                </label>
                <div className="max-h-36 overflow-y-auto space-y-1 p-2 bg-[#161619] border border-[#27272a] rounded-lg">
                  {models.map((m) => {
                    const isChecked = selectedModels.includes(m.modelId);
                    return (
                      <label
                        key={m.id}
                        className="flex items-center gap-2 p-1.5 rounded hover:bg-zinc-800 cursor-pointer text-xs text-zinc-300"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleModelSelection(m.modelId)}
                          className="rounded bg-zinc-900 border-zinc-700 text-emerald-500"
                        />
                        <span className="truncate">{m.name}</span>
                        <span className="text-[10px] text-zinc-400 font-mono ml-auto">
                          {m.providerName}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 text-xs font-medium hover:bg-zinc-700"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-white hover:bg-zinc-200 text-black text-xs font-semibold"
                >
                  สร้างคีย์
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Secret One-Time Modal */}
      {createdSecret && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#111113] border border-emerald-500/50 rounded-2xl p-6 shadow-2xl relative text-left">
            <h2 className="text-base font-semibold text-white mb-2 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              บันทึกและคัดลอก Client Key ของคุณ
            </h2>

            <p className="text-xs text-amber-300 bg-amber-950/40 border border-amber-900/50 p-2.5 rounded-lg mb-4 leading-relaxed">
              <strong>สำคัญมาก:</strong> กรุณาคัดลอกโทเค็น API นี้ทันที เนื่องจากเพื่อความปลอดภัย ระบบจะไม่แสดงคีย์ตัวเต็มนี้ซ้ำอีก!
            </p>

            <div className="p-3 bg-[#161619] border border-[#27272a] rounded-lg mb-4 flex items-center justify-between gap-2">
              <span className="font-mono text-xs text-emerald-400 break-all">{createdSecret}</span>
              <button
                onClick={() => copyToClipboard(createdSecret)}
                className="p-2 rounded bg-zinc-800 hover:bg-zinc-700 text-white shrink-0"
                title="คัดลอกไปยังคลิปบอร์ด"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setCreatedSecret(null)}
                className="px-4 py-2 rounded-lg bg-white hover:bg-zinc-200 text-black text-xs font-semibold"
              >
                ฉันได้บันทึกคีย์นี้แล้ว
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import {
  Boxes,
  Plus,
  Search,
  Trash2,
  Edit2,
  RefreshCw,
  Sparkles,
  Zap,
  CheckCircle2,
  X,
  Copy,
  Check,
  Terminal,
  Activity,
  ShieldCheck,
  Filter,
} from 'lucide-react';
import { ProviderModelItem, ProviderItem, UserRole } from '../../types';
import { api } from '../../lib/api';
import { useDisplay } from '../../context/DisplayContext';
import { GatewayActionBar } from '../common/GatewayActionBar';
import { MultiSelectDropdown } from '../common/MultiSelectDropdown';

interface ModelsViewProps {
  userRole: UserRole;
  onNavigateToPlayground?: (modelId?: string) => void;
}

export const ModelsView: React.FC<ModelsViewProps> = ({ userRole, onNavigateToPlayground }) => {
  const { textScaleClass } = useDisplay();
  const [models, setModels] = useState<ProviderModelItem[]>([]);
  const [providers, setProviders] = useState<ProviderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'free' | 'vision' | 'long_context'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<ProviderModelItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    providerId: '',
    modelId: '',
    contextLength: 128000,
    inputLimit: 128000,
    outputLimit: 8192,
    isFree: true,
    isFallbackEnabled: false,
    fallbackModels: [] as string[],
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [modelsData, provsData] = await Promise.all([api.getModels(), api.getProviders()]);
      setModels(modelsData);
      setProviders(provsData);
      if (provsData.length > 0 && !formData.providerId) {
        setFormData((prev) => ({ ...prev, providerId: provsData[0].id }));
      }
    } catch (err) {
      console.error('Failed to load models', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSyncFreeModels = async () => {
    try {
      setIsSyncing(true);
      setSyncFeedback(null);
      const res = await api.syncFreeModels();
      setSyncFeedback(res.message);
      await loadData();
      setTimeout(() => setSyncFeedback(null), 5000);
    } catch (err: any) {
      alert(err.message || 'ดึงโมเดลฟรีไม่สำเร็จ');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (id: string) => {
    if (userRole !== 'ADMIN') return;
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบโมเดลนี้ออกจากระบบเกตเวย์?')) return;
    try {
      await api.deleteModel(id);
      setModels((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      console.error('Failed to delete model', err);
    }
  };

  const openAddModal = () => {
    setEditingModel(null);
    setFormData({
      name: '',
      providerId: providers[0]?.id || '',
      modelId: '',
      contextLength: 128000,
      inputLimit: 128000,
      outputLimit: 8192,
      isFree: true,
      isFallbackEnabled: false,
      fallbackModels: [],
    });
    setIsModalOpen(true);
  };

  const openEditModal = (m: ProviderModelItem) => {
    setEditingModel(m);
    setFormData({
      name: m.name,
      providerId: m.providerId,
      modelId: m.modelId,
      contextLength: m.contextLength,
      inputLimit: m.inputLimit,
      outputLimit: m.outputLimit,
      isFree: m.isFree,
      isFallbackEnabled: m.isFallbackEnabled || false,
      fallbackModels: m.fallbackModels || [],
    });
    setIsModalOpen(true);
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userRole === 'VIEWER') return;

    try {
      if (editingModel) {
        await api.updateModel(editingModel.id, formData);
      } else {
        await api.createModel(formData);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'บันทึกข้อมูลโมเดลไม่สำเร็จ');
    }
  };

  const exportCsv = () => {
    const headers = ['Model ID', 'Name', 'Provider', 'Context Length', 'Max Output', 'Is Free', 'Active Keys', 'Total Requests'];
    const rows = filtered.map((m) => [
      `"${m.modelId}"`,
      `"${m.name}"`,
      `"${m.providerName}"`,
      m.contextLength,
      m.outputLimit,
      m.isFree ? 'Yes' : 'No',
      m.activeKeysCount,
      m.requestsCount,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ai_models_catalog_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filtered = models.filter((m) => {
    const matchSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.modelId.toLowerCase().includes(search.toLowerCase()) ||
      m.providerName.toLowerCase().includes(search.toLowerCase());
    const matchProv = selectedProvider === 'all' || m.providerId === selectedProvider;
    let matchCat = true;
    if (categoryFilter === 'free') matchCat = m.isFree;
    if (categoryFilter === 'long_context') matchCat = m.contextLength >= 100000;
    if (categoryFilter === 'vision') {
      matchCat = m.modelId.includes('vision') || m.modelId.includes('flash') || m.modelId.includes('4o') || m.name.toLowerCase().includes('vision');
    }
    return matchSearch && matchProv && matchCat;
  });

  const freeCount = models.filter((m) => m.isFree).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#27272a]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className={`${textScaleClass.heading} text-white tracking-tight`}>
              สารบบโมเดล AI (Model Registry)
            </h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
              {freeCount} โมเดลฟรี
            </span>
          </div>
          <p className={`${textScaleClass.subheading} mt-0.5`}>
            แคตตาล็อกโมเดล AI รวมศูนย์ พร้อมฟังก์ชันค้นหา สเปก Context Window และการเชื่อมโยงคีย์อัตโนมัติ
          </p>
        </div>

        <div className="flex items-center gap-2">
          {userRole !== 'VIEWER' && (
            <button
              id="models-add-btn"
              onClick={openAddModal}
              className={`flex items-center gap-1.5 rounded-lg bg-white hover:bg-zinc-200 text-black font-semibold transition-colors shadow-sm ${textScaleClass.btn}`}
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มโมเดลใหม่</span>
            </button>
          )}

          <button
            onClick={loadData}
            className="p-2 rounded-lg bg-[#121215] hover:bg-zinc-800 text-zinc-300 hover:text-white border border-[#27272a] transition-colors"
            title="รีเฟรชข้อมูล"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Sync Free Models Feedback Banner */}
      {syncFeedback && (
        <div className="p-3 bg-emerald-950/70 border border-emerald-800/80 rounded-xl flex items-center justify-between gap-3 text-emerald-200 text-xs shadow-md">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{syncFeedback}</span>
          </div>
          <button
            onClick={() => setSyncFeedback(null)}
            className="text-emerald-400 hover:text-white p-1 rounded-md transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Enterprise Gateway Action Bar */}
      <GatewayActionBar
        title="Model Directory"
        badge="Active"
        totalCount={filtered.length}
        itemLabel="โมเดล"
        onSyncFreeModels={handleSyncFreeModels}
        isSyncing={isSyncing}
        onExportCsv={exportCsv}
        onRefresh={loadData}
        isLoading={loading}
      />

      {/* Search & Filter Strip */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="models-search-input"
            type="text"
            placeholder="ค้นหาชื่อโมเดล หรือ Model ID (เช่น gemini-2.5-flash, llama-3.3)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full bg-[#121215] border border-[#27272a] rounded-lg pl-9 pr-3 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 ${textScaleClass.input}`}
          />
        </div>

        {/* Category Pills & Provider Filter */}
        <div className="flex items-center flex-wrap gap-2 w-full md:w-auto">
          <div className="flex items-center bg-[#121215] border border-[#27272a] rounded-lg p-0.5">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                categoryFilter === 'all' ? 'bg-zinc-700 text-white shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              ทั้งหมด
            </button>
            <button
              onClick={() => setCategoryFilter('free')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${
                categoryFilter === 'free'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>ฟรี 100%</span>
            </button>
            <button
              onClick={() => setCategoryFilter('long_context')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                categoryFilter === 'long_context' ? 'bg-zinc-700 text-white shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Context 100k+
            </button>
            <button
              onClick={() => setCategoryFilter('vision')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                categoryFilter === 'vision' ? 'bg-zinc-700 text-white shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Vision / Multimodal
            </button>
          </div>

          <select
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value)}
            className={`bg-[#121215] border border-[#27272a] rounded-lg px-3 text-zinc-300 focus:outline-none focus:border-zinc-500 ${textScaleClass.input}`}
          >
            <option value="all">ทุกผู้ให้บริการ ({providers.length} ค่าย)</option>
            {providers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Enterprise Data Table */}
      <div className="overflow-x-auto rounded-xl border border-[#27272a] bg-[#121215] shadow-lg">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className={`border-b border-[#27272a] bg-[#16161a] text-zinc-400 font-semibold uppercase tracking-wider ${textScaleClass.th}`}>
              <th>ชื่อโมเดล & Model ID</th>
              <th>ผู้ให้บริการ</th>
              <th>Context Window</th>
              <th>Max Output</th>
              <th>ประเภทสิทธิ์ (Tier)</th>
              <th>โมเดลสำรอง (Fallback)</th>
              <th>พูลคีย์ที่พร้อมใช้งาน</th>
              <th>คำขอทั้งหมด</th>
              <th className="text-right">การจัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#27272a]/60">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-zinc-500 text-xs">
                  <div className="space-y-2">
                    <Boxes className="w-8 h-8 text-zinc-600 mx-auto" />
                    <p>ไม่พบโมเดลที่ตรงกับเงื่อนไขการค้นหา</p>
                    <button
                      onClick={handleSyncFreeModels}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-500 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>ดึงโมเดลฟรีล่าสุด</span>
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((m) => (
                <tr key={m.id} className="transition-colors hover:bg-[#18181c]">
                  {/* Model Name & ID */}
                  <td className={textScaleClass.td}>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{m.name}</span>
                      {m.isFree && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                          FREE
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <code className="font-mono text-zinc-400 text-xs bg-[#18181b] px-1.5 py-0.5 rounded border border-[#27272a]">
                        {m.modelId}
                      </code>
                      <button
                        onClick={() => handleCopy(m.modelId, m.id)}
                        className="text-zinc-500 hover:text-zinc-300 p-0.5 rounded transition-colors"
                        title="คัดลอก Model ID"
                      >
                        {copiedId === m.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </td>

                  {/* Provider */}
                  <td className={textScaleClass.td}>
                    <span className="inline-flex items-center gap-1.5 bg-[#18181b] px-2.5 py-1 rounded-md text-zinc-200 text-xs font-medium border border-[#27272a]">
                      {m.providerName}
                    </span>
                  </td>

                  {/* Context Window */}
                  <td className={`${textScaleClass.td} font-mono`}>
                    <span className="font-bold text-zinc-100">
                      {m.contextLength >= 1000000
                        ? `${(m.contextLength / 1000000).toFixed(1)}M`
                        : `${(m.contextLength / 1000).toFixed(0)}k`}
                    </span>
                    <span className="text-zinc-500 text-[11px] ml-1">tokens</span>
                  </td>

                  {/* Max Output */}
                  <td className={`${textScaleClass.td} font-mono text-zinc-300`}>
                    {m.outputLimit.toLocaleString()}
                  </td>

                  {/* Pricing / Tier */}
                  <td className={textScaleClass.td}>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        m.isFree
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                      }`}
                    >
                      {m.isFree ? (
                        <>
                          <Zap className="w-3 h-3 text-emerald-400" />
                          <span>Free Tier 100%</span>
                        </>
                      ) : (
                        <span>Paid Usage</span>
                      )}
                    </span>
                  </td>

                  {/* Fallback */}
                  <td className={textScaleClass.td}>
                    {m.isFallbackEnabled && m.fallbackModels && m.fallbackModels.length > 0 ? (
                      <div className="flex -space-x-2">
                        {m.fallbackModels.slice(0, 3).map((fid, idx) => {
                          const fallbackObj = models.find(x => x.id === fid);
                          return (
                            <div
                              key={fid}
                              title={fallbackObj?.name || fid}
                              className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[9px] font-bold text-zinc-300 z-10 hover:z-20 relative"
                              style={{ zIndex: 10 - idx }}
                            >
                              {fallbackObj?.name.charAt(0) || '?'}
                            </div>
                          );
                        })}
                        {m.fallbackModels.length > 3 && (
                          <div className="w-6 h-6 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[9px] font-bold text-zinc-500 z-0 relative">
                            +{m.fallbackModels.length - 3}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-zinc-600 text-xs">-</span>
                    )}
                  </td>

                  {/* Active Keys Pool */}
                  <td className={`${textScaleClass.td} font-mono`}>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${m.activeKeysCount > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}`} />
                      <span className="font-bold text-white">{m.activeKeysCount}</span>
                      <span className="text-zinc-500 text-xs">คีย์พร้อม</span>
                    </div>
                  </td>

                  {/* Total Invocations */}
                  <td className={`${textScaleClass.td} font-mono text-zinc-300`}>
                    {m.requestsCount.toLocaleString()}
                  </td>

                  {/* Actions */}
                  <td className={`${textScaleClass.td} text-right`}>
                    <div className="flex items-center justify-end gap-1.5">
                      {onNavigateToPlayground && (
                        <button
                          onClick={() => onNavigateToPlayground(m.modelId)}
                          className="p-1.5 rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40 transition-colors"
                          title="ทดสอบโมเดลนี้ใน Playground"
                        >
                          <Terminal className="w-4 h-4" />
                        </button>
                      )}

                      {userRole !== 'VIEWER' && (
                        <button
                          onClick={() => openEditModal(m)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                          title="แก้ไขโมเดล"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}

                      {userRole === 'ADMIN' && (
                        <button
                          onClick={() => handleDelete(m.id)}
                          className="p-1.5 rounded-lg text-rose-400 hover:text-rose-200 hover:bg-rose-950/40 transition-colors"
                          title="ลบโมเดล"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-[#121215] border border-[#27272a] rounded-2xl p-6 shadow-2xl relative text-left">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-base font-semibold text-white mb-1">
              {editingModel ? 'แก้ไขสเปกโมเดล' : 'ลงทะเบียนโมเดล AI ใหม่'}
            </h2>
            <p className="text-xs text-zinc-400 mb-4">
              กำหนดชื่อ, Model ID และค่าโควต้าความยาวโทเค็น
            </p>

            <form onSubmit={handleSaveModal} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">ผู้ให้บริการ (Provider)</label>
                <select
                  required
                  value={formData.providerId}
                  onChange={(e) => setFormData({ ...formData, providerId: e.target.value })}
                  className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500"
                >
                  {providers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">ชื่อโมเดลที่แสดง</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น Gemini 2.5 Flash, Llama 3.3 70B"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">รหัสโมเดล (Model ID)</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น gemini-2.5-flash, llama-3.3-70b-versatile"
                  value={formData.modelId}
                  onChange={(e) => setFormData({ ...formData, modelId: e.target.value })}
                  className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Context Window</label>
                  <input
                    type="number"
                    value={formData.contextLength}
                    onChange={(e) => setFormData({ ...formData, contextLength: Number(e.target.value) })}
                    className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-zinc-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Max Output Limit</label>
                  <input
                    type="number"
                    value={formData.outputLimit}
                    onChange={(e) => setFormData({ ...formData, outputLimit: Number(e.target.value) })}
                    className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-zinc-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="model-is-free"
                  checked={formData.isFree}
                  onChange={(e) => setFormData({ ...formData, isFree: e.target.checked })}
                  className="rounded bg-[#18181b] border-zinc-700 text-emerald-500 focus:ring-0"
                />
                <label htmlFor="model-is-free" className="text-xs text-zinc-300 font-medium">
                  เข้าเกณฑ์ Free Tier (เส้นทางฟรี 100%)
                </label>
              </div>

              <div className="border-t border-[#27272a] pt-3 mt-3">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-zinc-300">ระบบสลับโมเดลอัตโนมัติ (Fallback)</label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <div className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${formData.isFallbackEnabled ? 'bg-emerald-500' : 'bg-zinc-700'}`}>
                      <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${formData.isFallbackEnabled ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                    </div>
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={formData.isFallbackEnabled}
                      onChange={(e) => setFormData({ ...formData, isFallbackEnabled: e.target.checked })}
                    />
                  </label>
                </div>
                
                {formData.isFallbackEnabled && (
                  <div className="mt-2">
                    <MultiSelectDropdown
                      title="เลือกโมเดลสำรอง"
                      options={models.filter(m => m.id !== editingModel?.id).map(m => ({
                        value: m.id,
                        label: m.name,
                        sublabel: m.providerName
                      }))}
                      selectedValues={formData.fallbackModels}
                      onChange={(selected) => setFormData({ ...formData, fallbackModels: selected })}
                      placeholder="เลือกโมเดล (เรียงตามลำดับความสำคัญ)"
                    />
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 text-xs font-medium hover:bg-zinc-700 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-white hover:bg-zinc-200 text-black text-xs font-semibold transition-colors"
                >
                  บันทึกโมเดล
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

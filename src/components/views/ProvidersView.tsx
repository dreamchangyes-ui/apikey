import React, { useEffect, useState } from 'react';
import {
  Plus,
  Search,
  Cpu,
  ExternalLink,
  Power,
  Trash2,
  Edit2,
  Activity,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Zap,
  Layers,
  Wind,
  Compass,
  Share2,
  Smile,
  RefreshCw,
  X,
  LayoutGrid,
  List,
} from 'lucide-react';
import { ProviderItem, UserRole } from '../../types';
import { api } from '../../lib/api';
import { useDisplay } from '../../context/DisplayContext';
import { GatewayActionBar } from '../common/GatewayActionBar';

interface ProvidersViewProps {
  userRole: UserRole;
}

export const ProvidersView: React.FC<ProvidersViewProps> = ({ userRole }) => {
  const { textScaleClass } = useDisplay();
  const [providers, setProviders] = useState<ProviderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [search, setSearch] = useState('');
  const [viewStyle, setViewStyle] = useState<'table' | 'cards'>('table');
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; success: boolean; latency: number; msg: string } | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<ProviderItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    baseUrl: '',
    docsUrl: '',
    authType: 'BEARER_TOKEN' as 'BEARER_TOKEN' | 'API_KEY_HEADER' | 'QUERY_PARAM',
    rpmLimit: 30,
    tpmLimit: 30000,
    rpdLimit: 2000,
    freeTier: '',
    notes: '',
    logo: 'Cpu',
  });

  const loadProviders = async () => {
    try {
      setLoading(true);
      const data = await api.getProviders();
      setProviders(data);
    } catch (err) {
      console.error('Failed to load providers', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProviders();
  }, []);

  const handleTestConnection = async (id: string) => {
    try {
      setTestingId(id);
      setTestResult(null);
      const res = await api.testProvider(id);
      setTestResult({
        id,
        success: res.success,
        latency: res.latencyMs,
        msg: res.message,
      });
      loadProviders();
    } catch (err: any) {
      setTestResult({
        id,
        success: false,
        latency: 0,
        msg: err.message || 'Connection test failed',
      });
    } finally {
      setTestingId(null);
    }
  };

  const handleToggleStatus = async (p: ProviderItem) => {
    if (userRole === 'VIEWER') return;
    const nextStatus = p.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await api.updateProvider(p.id, { status: nextStatus });
      setProviders((prev) =>
        prev.map((item) => (item.id === p.id ? { ...item, status: nextStatus } : item))
      );
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (userRole !== 'ADMIN') return;
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบผู้ให้บริการนี้? การดำเนินการนี้จะลบคีย์และโมเดลที่เกี่ยวข้องทั้งหมด')) return;
    try {
      await api.deleteProvider(id);
      setProviders((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error('Failed to delete provider', err);
    }
  };

  const openAddModal = () => {
    setEditingProvider(null);
    setFormData({
      name: '',
      slug: '',
      baseUrl: '',
      docsUrl: '',
      authType: 'BEARER_TOKEN',
      rpmLimit: 30,
      tpmLimit: 30000,
      rpdLimit: 2000,
      freeTier: '',
      notes: '',
      logo: 'Cpu',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (p: ProviderItem) => {
    setEditingProvider(p);
    setFormData({
      name: p.name,
      slug: p.slug,
      baseUrl: p.baseUrl,
      docsUrl: p.docsUrl,
      authType: p.authType,
      rpmLimit: p.rpmLimit,
      tpmLimit: p.tpmLimit,
      rpdLimit: p.rpdLimit,
      freeTier: p.freeTier,
      notes: p.notes,
      logo: p.logo,
    });
    setIsModalOpen(true);
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userRole === 'VIEWER') return;

    try {
      if (editingProvider) {
        await api.updateProvider(editingProvider.id, formData);
      } else {
        await api.createProvider(formData);
      }
      setIsModalOpen(false);
      loadProviders();
    } catch (err: any) {
      alert(err.message || 'Error saving provider');
    }
  };

  const getProviderIcon = (logo: string) => {
    switch (logo) {
      case 'Sparkles': return Sparkles;
      case 'Zap': return Zap;
      case 'Layers': return Layers;
      case 'Wind': return Wind;
      case 'Compass': return Compass;
      case 'Share2': return Share2;
      case 'Smile': return Smile;
      default: return Cpu;
    }
  };

  const exportCsv = () => {
    const headers = ['Name', 'Slug', 'Status', 'Base URL', 'RPM Limit', 'TPM Limit', 'RPD Limit', 'Active Keys', 'Models Count', 'Latency (ms)'];
    const rows = filtered.map((p) => [
      `"${p.name}"`,
      `"${p.slug}"`,
      p.status,
      `"${p.baseUrl}"`,
      p.rpmLimit,
      p.tpmLimit,
      p.rpdLimit,
      p.activeKeysCount,
      p.modelsCount,
      p.latencyMs,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ai_providers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filtered = providers.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase()) ||
      p.freeTier?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#27272a]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className={`${textScaleClass.heading} text-white tracking-tight`}>
              การจัดการผู้ให้บริการ AI (AI Providers)
            </h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
              {providers.length} ผู้ให้บริการ
            </span>
          </div>
          <p className={`${textScaleClass.subheading} mt-0.5`}>
            เชื่อมต่อและกำหนดค่าผู้ให้บริการ AI, Base Endpoint, โควต้า และนโยบาย Free Tier
          </p>
        </div>

        <div className="flex items-center gap-2">
          {userRole !== 'VIEWER' && (
            <button
              id="providers-add-btn"
              onClick={openAddModal}
              className={`flex items-center gap-1.5 rounded-lg bg-white hover:bg-zinc-200 text-black font-semibold transition-colors shadow-sm ${textScaleClass.btn}`}
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มผู้ให้บริการ</span>
            </button>
          )}

          <button
            onClick={loadProviders}
            className="p-2 rounded-lg bg-[#121215] hover:bg-zinc-800 text-zinc-300 hover:text-white border border-[#27272a] transition-colors"
            title="รีเฟรชผู้ให้บริการ"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Enterprise Gateway Action Bar */}
      <GatewayActionBar
        title="Providers Directory"
        badge="Active Endpoints"
        totalCount={filtered.length}
        itemLabel="ผู้ให้บริการ"
        onSyncFreeModels={async () => {
          try {
            setIsSyncing(true);
            const res = await api.syncFreeModels();
            alert(res.message);
            await loadProviders();
          } catch (e: any) {
            alert(e.message || 'ซิงค์ไม่สำเร็จ');
          } finally {
            setIsSyncing(false);
          }
        }}
        isSyncing={isSyncing}
        onExportCsv={exportCsv}
        onRefresh={loadProviders}
        isLoading={loading}
      />

      {/* Filter / Search Bar & View Mode Toggle */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="providers-search-input"
            type="text"
            placeholder="ค้นหาผู้ให้บริการตามชื่อ, slug หรือข้อกำหนด Free Tier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full bg-[#121215] border border-[#27272a] rounded-lg pl-9 pr-3 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 ${textScaleClass.input}`}
          />
        </div>

        {/* View Style Switcher */}
        <div className="flex items-center gap-1 bg-[#121215] p-1 rounded-lg border border-[#27272a] self-end sm:self-auto">
          <button
            onClick={() => setViewStyle('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              viewStyle === 'table' ? 'bg-[#1e1e24] text-white shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>ตาราง</span>
          </button>
          <button
            onClick={() => setViewStyle('cards')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              viewStyle === 'cards' ? 'bg-[#1e1e24] text-white shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>การ์ด</span>
          </button>
        </div>
      </div>

      {/* Enterprise Table View */}
      {viewStyle === 'table' ? (
        <div className="overflow-x-auto rounded-xl border border-[#27272a] bg-[#121215] shadow-lg">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className={`border-b border-[#27272a] bg-[#16161a] text-zinc-400 font-semibold uppercase tracking-wider ${textScaleClass.th}`}>
                <th>ผู้ให้บริการ AI</th>
                <th>สถานะ</th>
                <th>Base Endpoint</th>
                <th>นโยบาย Free Tier</th>
                <th>ข้อจำกัด (RPM/TPM/RPD)</th>
                <th>คีย์ & โมเดล</th>
                <th>เวลาแฝง</th>
                <th className="text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272a]/60">
              {filtered.map((p) => {
                const Icon = getProviderIcon(p.logo);
                const isTesting = testingId === p.id;
                const result = testResult?.id === p.id ? testResult : null;

                return (
                  <tr key={p.id} className="transition-colors hover:bg-[#18181c]">
                    {/* Provider Name */}
                    <td className={textScaleClass.td}>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#18181b] border border-[#27272a] flex items-center justify-center text-zinc-200 shrink-0">
                          <Icon className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div>
                          <div className="font-semibold text-white">{p.name}</div>
                          <div className="text-[11px] text-zinc-400 font-mono">{p.slug}</div>
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className={textScaleClass.td}>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          p.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-zinc-800/80 text-zinc-400 border-zinc-700'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            p.status === 'ACTIVE' ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'
                          }`}
                        />
                        {p.status === 'ACTIVE' ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                      </span>
                    </td>

                    {/* Base URL */}
                    <td className={`${textScaleClass.td} font-mono text-zinc-300 text-xs max-w-xs truncate`}>
                      {p.baseUrl}
                    </td>

                    {/* Free Tier */}
                    <td className={`${textScaleClass.td} max-w-xs`}>
                      <span className="text-xs text-emerald-300 line-clamp-1 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        {p.freeTier || 'ไม่มีรายละเอียดระบุ'}
                      </span>
                    </td>

                    {/* Limits */}
                    <td className={`${textScaleClass.td} font-mono text-zinc-300 text-xs`}>
                      <span className="text-zinc-200">{p.rpmLimit} RPM</span>
                      <span className="text-zinc-600"> / </span>
                      <span className="text-zinc-200">{(p.tpmLimit / 1000).toFixed(0)}k TPM</span>
                      <span className="text-zinc-600"> / </span>
                      <span className="text-zinc-200">{p.rpdLimit} RPD</span>
                    </td>

                    {/* Keys & Models */}
                    <td className={`${textScaleClass.td} font-mono text-xs`}>
                      <span className="text-emerald-400 font-bold">{p.activeKeysCount}</span>
                      <span className="text-zinc-400">/{p.keysCount} คีย์</span>
                      <span className="text-zinc-600"> • </span>
                      <span className="text-cyan-400 font-bold">{p.modelsCount} โมเดล</span>
                    </td>

                    {/* Latency */}
                    <td className={`${textScaleClass.td} font-mono text-cyan-400 text-xs font-semibold`}>
                      {p.latencyMs}ms
                    </td>

                    {/* Actions */}
                    <td className={`${textScaleClass.td} text-right`}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          id={`test-prov-${p.id}`}
                          onClick={() => handleTestConnection(p.id)}
                          disabled={isTesting}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-cyan-400 hover:bg-zinc-800 transition-colors"
                          title="ทดสอบการเชื่อมต่อ"
                        >
                          <Activity className={`w-4 h-4 ${isTesting ? 'animate-spin text-cyan-400' : ''}`} />
                        </button>

                        {p.docsUrl && (
                          <a
                            href={p.docsUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                            title="คู่มือ API"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}

                        {userRole !== 'VIEWER' && (
                          <>
                            <button
                              onClick={() => handleToggleStatus(p)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                p.status === 'ACTIVE'
                                  ? 'text-emerald-400 hover:bg-zinc-800'
                                  : 'text-zinc-500 hover:bg-zinc-800'
                              }`}
                              title={p.status === 'ACTIVE' ? 'ปิดการใช้งาน' : 'เปิดการใช้งาน'}
                            >
                              <Power className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => openEditModal(p)}
                              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                              title="แก้ไขข้อมูลผู้ให้บริการ"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </>
                        )}

                        {userRole === 'ADMIN' && (
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-200 hover:bg-rose-950/40 transition-colors"
                            title="ลบผู้ให้บริการ"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Provider Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => {
            const Icon = getProviderIcon(p.logo);
            const isTesting = testingId === p.id;
            const result = testResult?.id === p.id ? testResult : null;

            return (
              <div
                key={p.id}
                id={`provider-card-${p.slug}`}
                className="p-4 rounded-xl bg-[#121215] border border-[#27272a] hover:border-zinc-700 transition-all flex flex-col justify-between shadow-xs"
              >
                <div>
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-[#18181b] border border-[#27272a] flex items-center justify-center text-zinc-200">
                        <Icon className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-white tracking-tight flex items-center gap-1.5">
                          {p.name}
                        </h3>
                        <div className="text-xs text-zinc-400 font-mono">{p.slug}</div>
                      </div>
                    </div>

                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                        p.status === 'ACTIVE'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                      }`}
                    >
                      {p.status === 'ACTIVE' ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                    </span>
                  </div>

                  {/* Base URL */}
                  <div className="p-2.5 rounded-lg bg-[#18181b] border border-[#27272a] mb-3 space-y-1">
                    <div className="text-[11px] text-zinc-400 font-medium">Base Endpoint</div>
                    <div className="text-xs text-zinc-300 font-mono truncate">{p.baseUrl}</div>
                  </div>

                  {/* Free Tier info */}
                  <div className="mb-3">
                    <div className="text-[11px] uppercase tracking-wider text-emerald-400 font-semibold mb-1">
                      ข้อกำหนด Free Tier
                    </div>
                    <p className="text-xs text-zinc-300 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2.5 leading-relaxed">
                      {p.freeTier || 'ไม่มีรายละเอียด Free Tier ที่ระบุ'}
                    </p>
                  </div>

                  {/* Limits & Stats Grid */}
                  <div className="grid grid-cols-3 gap-2 py-2 border-t border-[#27272a] text-center">
                    <div className="bg-[#18181b] rounded-lg p-2 border border-[#27272a]">
                      <div className="text-[11px] text-zinc-400">จำกัด RPM</div>
                      <div className="text-xs font-semibold text-white font-mono">{p.rpmLimit}</div>
                    </div>
                    <div className="bg-[#18181b] rounded-lg p-2 border border-[#27272a]">
                      <div className="text-[11px] text-zinc-400">จำกัด TPM</div>
                      <div className="text-xs font-semibold text-white font-mono">
                        {(p.tpmLimit / 1000).toFixed(0)}k
                      </div>
                    </div>
                    <div className="bg-[#18181b] rounded-lg p-2 border border-[#27272a]">
                      <div className="text-[11px] text-zinc-400">จำกัด RPD</div>
                      <div className="text-xs font-semibold text-white font-mono">{p.rpdLimit}</div>
                    </div>
                  </div>

                  {/* Pool Status */}
                  <div className="flex items-center justify-between py-2 text-xs text-zinc-400">
                    <span>
                      โมเดล: <strong className="text-white font-mono">{p.modelsCount}</strong>
                    </span>
                    <span>
                      คีย์ที่ใช้งาน: <strong className="text-emerald-400 font-mono">{p.activeKeysCount}</strong> /{' '}
                      <span className="text-zinc-400 font-mono">{p.keysCount}</span>
                    </span>
                    <span>
                      เวลาแฝง: <strong className="text-cyan-400 font-mono">{p.latencyMs}ms</strong>
                    </span>
                  </div>

                  {/* Live Test Result Badge */}
                  {result && (
                    <div
                      className={`mt-2 p-2.5 rounded-lg text-xs flex items-center gap-2 border ${
                        result.success
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                          : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                      }`}
                    >
                      {result.success ? (
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                      ) : (
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                      )}
                      <span className="truncate">{result.msg}</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="pt-3 mt-3 border-t border-[#27272a] flex items-center justify-between gap-2">
                  <button
                    id={`test-prov-${p.id}`}
                    onClick={() => handleTestConnection(p.id)}
                    disabled={isTesting}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#18181b] hover:bg-zinc-800 text-zinc-200 text-xs font-semibold border border-[#27272a] transition-colors disabled:opacity-50"
                  >
                    <Activity className={`w-3.5 h-3.5 text-cyan-400 ${isTesting ? 'animate-spin' : ''}`} />
                    <span>{isTesting ? 'กำลังทดสอบ...' : 'ทดสอบ'}</span>
                  </button>

                  <div className="flex items-center gap-1">
                    {p.docsUrl && (
                      <a
                        href={p.docsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                        title="คู่มือ API"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}

                    {userRole !== 'VIEWER' && (
                      <>
                        <button
                          onClick={() => handleToggleStatus(p)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            p.status === 'ACTIVE'
                              ? 'text-emerald-400 hover:bg-zinc-800'
                              : 'text-zinc-500 hover:bg-zinc-800'
                          }`}
                          title={p.status === 'ACTIVE' ? 'ปิดการใช้งาน' : 'เปิดการใช้งาน'}
                        >
                          <Power className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => openEditModal(p)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                          title="แก้ไขข้อมูลผู้ให้บริการ"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </>
                    )}

                    {userRole === 'ADMIN' && (
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="p-1.5 rounded-lg text-rose-400 hover:text-rose-200 hover:bg-rose-950/40 transition-colors"
                        title="ลบผู้ให้บริการ"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#121215] border border-[#27272a] rounded-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-base font-semibold text-white mb-4">
              {editingProvider ? 'แก้ไขข้อมูลผู้ให้บริการ' : 'เพิ่มผู้ให้บริการ AI'}
            </h2>

            <form onSubmit={handleSaveModal} className="space-y-4 text-left">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">ชื่อผู้ให้บริการ</label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น Groq"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">รหัสระบุ (Slug)</label>
                  <input
                    type="text"
                    placeholder="เช่น groq"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Base Endpoint URL</label>
                <input
                  type="url"
                  required
                  placeholder="https://api.groq.com/openai/v1"
                  value={formData.baseUrl}
                  onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                  className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">URL เอกสารคู่มือ</label>
                  <input
                    type="url"
                    placeholder="https://console.groq.com/docs"
                    value={formData.docsUrl}
                    onChange={(e) => setFormData({ ...formData, docsUrl: e.target.value })}
                    className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">ประเภทการยืนยันตัวตน</label>
                  <select
                    value={formData.authType}
                    onChange={(e: any) => setFormData({ ...formData, authType: e.target.value })}
                    className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500"
                  >
                    <option value="BEARER_TOKEN">Bearer Token (Authorization)</option>
                    <option value="API_KEY_HEADER">API-Key Header (x-api-key)</option>
                    <option value="QUERY_PARAM">Query Parameter (?key=...)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">จำกัด RPM</label>
                  <input
                    type="number"
                    value={formData.rpmLimit}
                    onChange={(e) => setFormData({ ...formData, rpmLimit: Number(e.target.value) })}
                    className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">จำกัด TPM</label>
                  <input
                    type="number"
                    value={formData.tpmLimit}
                    onChange={(e) => setFormData({ ...formData, tpmLimit: Number(e.target.value) })}
                    className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">จำกัดรายวัน (RPD)</label>
                  <input
                    type="number"
                    value={formData.rpdLimit}
                    onChange={(e) => setFormData({ ...formData, rpdLimit: Number(e.target.value) })}
                    className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">รายละเอียด Free Tier</label>
                <textarea
                  rows={2}
                  placeholder="รายละเอียดเกี่ยวกับโควต้าฟรีและเงื่อนไขการใช้งาน..."
                  value={formData.freeTier}
                  onChange={(e) => setFormData({ ...formData, freeTier: e.target.value })}
                  className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">หมายเหตุภายใน</label>
                <input
                  type="text"
                  placeholder="ข้อกำหนดการเราต์หรือข้อจำกัดพิเศษ"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-white"
                />
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
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

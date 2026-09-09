import React, { useEffect, useState, useMemo } from 'react';
import {
  KeyRound,
  Plus,
  Search,
  RotateCw,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  Lock,
  RefreshCw,
  Power,
  X,
  Zap,
  Copy,
  Check,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Layers,
} from 'lucide-react';
import { ApiKeyItem, ProviderItem, UserRole } from '../../types';
import { api } from '../../lib/api';
import { useDisplay } from '../../context/DisplayContext';
import { GatewayActionBar } from '../common/GatewayActionBar';
import { TableFilterBar } from '../common/TableFilterBar';
import { DateRangeFilterValue } from '../common/DateRangeDropdown';
import { MultiSelectOption } from '../common/MultiSelectDropdown';

interface ApiKeysViewProps {
  userRole: UserRole;
}

export const ApiKeysView: React.FC<ApiKeysViewProps> = ({ userRole }) => {
  const { textScaleClass } = useDisplay();
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [providers, setProviders] = useState<ProviderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Multi-Select Filters
  const [search, setSearch] = useState('');
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<DateRangeFilterValue>({ preset: 'all' });

  // Bulk Selection
  const [selectedKeyIds, setSelectedKeyIds] = useState<string[]>([]);

  // Add Key Modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newKeyForm, setNewKeyForm] = useState({
    providerId: '',
    label: '',
    rawKey: '',
    priority: 1,
    quotaTotal: 1500,
  });

  // Rotate Modal
  const [rotatingKey, setRotatingKey] = useState<ApiKeyItem | null>(null);
  const [rotateRawSecret, setRotateRawSecret] = useState('');

  // Status/Test Feedback
  const [testingKeyId, setTestingKeyId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; msg: string; valid: boolean } | null>(null);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  const handleCopyMasked = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [keysData, provsData] = await Promise.all([api.getApiKeys(), api.getProviders()]);
      setKeys(keysData);
      setProviders(provsData);
      if (provsData.length > 0 && !newKeyForm.providerId) {
        setNewKeyForm((prev) => ({ ...prev, providerId: provsData[0].id }));
      }
    } catch (err) {
      console.error('Failed to load api keys', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTestKey = async (id: string) => {
    try {
      setTestingKeyId(id);
      setTestResult(null);
      const res = await api.testApiKey(id);
      setTestResult({ id, msg: res.message, valid: res.valid });
    } catch (err: any) {
      setTestResult({ id, msg: err.message || 'Key test failed', valid: false });
    } finally {
      setTestingKeyId(null);
    }
  };

  const handleToggleKey = async (k: ApiKeyItem) => {
    if (userRole === 'VIEWER') return;
    const nextStatus = k.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    try {
      await api.updateApiKey(k.id, { status: nextStatus });
      setKeys((prev) => prev.map((item) => (item.id === k.id ? { ...item, status: nextStatus } : item)));
    } catch (err) {
      console.error('Failed to update key status', err);
    }
  };

  const handleBulkToggle = async (status: 'ACTIVE' | 'DISABLED') => {
    if (userRole === 'VIEWER') return;
    if (selectedKeyIds.length === 0) return;
    if (!confirm(`คุณแน่ใจหรือไม่ว่าต้องการ ${status === 'ACTIVE' ? 'เปิดใช้งาน' : 'ปิดใช้งาน'} ${selectedKeyIds.length} คีย์ที่เลือก?`)) return;

    try {
      await Promise.all(selectedKeyIds.map(id => api.updateApiKey(id, { status })));
      setKeys((prev) => prev.map((item) => selectedKeyIds.includes(item.id) ? { ...item, status } : item));
      setSelectedKeyIds([]);
    } catch (err) {
      console.error('Failed to update keys bulk', err);
      alert('เกิดข้อผิดพลาดในการอัปเดตสถานะคีย์บางรายการ');
    }
  };

  const handleDelete = async (id: string) => {
    if (userRole !== 'ADMIN') return;
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบ API Key นี้อย่างถาวร?')) return;
    try {
      await api.deleteApiKey(id);
      setKeys((prev) => prev.filter((k) => k.id !== id));
    } catch (err) {
      console.error('Failed to delete key', err);
    }
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userRole === 'VIEWER') return;

    try {
      await api.createApiKey(newKeyForm);
      setIsAddOpen(false);
      setNewKeyForm({
        providerId: providers[0]?.id || '',
        label: '',
        rawKey: '',
        priority: 1,
        quotaTotal: 1500,
      });
      loadData();
    } catch (err: any) {
      alert(err.message || 'เกิดข้อผิดพลาดในการบันทึก API Key');
    }
  };

  const handleRotateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rotatingKey || userRole === 'VIEWER') return;

    try {
      await api.rotateApiKey(rotatingKey.id, rotateRawSecret || undefined);
      setRotatingKey(null);
      setRotateRawSecret('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'การหมุนเวียนคีย์ล้มเหลว');
    }
  };

  const exportCsv = () => {
    const headers = ['Label', 'Provider', 'Masked Key', 'Status', 'Priority', 'Requests', 'Quota Used', 'Quota Total', 'Last Used'];
    const rows = filtered.map((k) => [
      `"${k.label}"`,
      `"${k.providerName}"`,
      `"${k.maskedKey}"`,
      k.status,
      k.priority,
      k.requestsCount,
      k.quotaUsed,
      k.quotaTotal,
      k.lastUsedAt || 'Never',
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `provider_api_keys_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Provider Options for MultiSelect
  const providerOptions: MultiSelectOption[] = useMemo(() => {
    return providers.map((p) => {
      const count = keys.filter(
        (k) =>
          (k.providerName || '').toLowerCase() === p.name.toLowerCase() ||
          k.providerId === p.id
      ).length;
      return {
        value: p.id,
        label: p.name,
        count,
      };
    });
  }, [providers, keys]);

  // Status Options for MultiSelect
  const statusOptions: MultiSelectOption[] = useMemo(() => {
    const activeC = keys.filter((k) => k.status === 'ACTIVE').length;
    const rateLimitedC = keys.filter((k) => k.status === 'RATE_LIMITED').length;
    const cooldownC = keys.filter((k) => k.status === 'COOLDOWN').length;
    const disabledC = keys.filter((k) => k.status === 'DISABLED' || k.status === 'ERROR').length;
    return [
      { value: 'ACTIVE', label: 'ACTIVE (พร้อมใช้งาน)', count: activeC },
      { value: 'RATE_LIMITED', label: 'RATE LIMITED (ติดลิมิต)', count: rateLimitedC },
      { value: 'COOLDOWN', label: 'COOLDOWN (คูลดาวน์)', count: cooldownC },
      { value: 'DISABLED', label: 'DISABLED (ปิดใช้งาน)', count: disabledC },
    ];
  }, [keys]);

  const resetFilters = () => {
    setSearch('');
    setSelectedProviders([]);
    setSelectedStatuses([]);
    setDateRange({ preset: 'all' });
  };

  const filtered = useMemo(() => {
    return keys.filter((k) => {
      // 1. Search Query
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchLabel = (k.label || '').toLowerCase().includes(q);
        const matchProv = (k.providerName || '').toLowerCase().includes(q);
        const matchKey = (k.maskedKey || '').toLowerCase().includes(q);
        if (!matchLabel && !matchProv && !matchKey) return false;
      }

      // 2. Providers Multi-Select
      if (selectedProviders.length > 0) {
        const provName = (k.providerName || '').toLowerCase();
        const provId = (k.providerId || '').toLowerCase();
        const hasMatch = selectedProviders.some(
          (sp) => sp.toLowerCase() === provName || sp.toLowerCase() === provId
        );
        if (!hasMatch) return false;
      }

      // 3. Status Multi-Select
      if (selectedStatuses.length > 0) {
        if (!selectedStatuses.includes(k.status)) return false;
      }

      // 4. Date Range Filter (based on createdAt or lastUsedAt)
      if (dateRange.preset !== 'all') {
        const keyTime = new Date(k.createdAt || k.lastUsedAt || Date.now()).getTime();
        const now = Date.now();

        if (dateRange.preset === 'today') {
          const startOfToday = new Date();
          startOfToday.setHours(0, 0, 0, 0);
          if (keyTime < startOfToday.getTime()) return false;
        } else if (dateRange.preset === '24h') {
          if (keyTime < now - 24 * 3600 * 1000) return false;
        } else if (dateRange.preset === '7d') {
          if (keyTime < now - 7 * 86400 * 1000) return false;
        } else if (dateRange.preset === '30d') {
          if (keyTime < now - 30 * 86400 * 1000) return false;
        } else if (dateRange.preset === 'custom') {
          if (dateRange.startDate) {
            const start = new Date(dateRange.startDate).setHours(0, 0, 0, 0);
            if (keyTime < start) return false;
          }
          if (dateRange.endDate) {
            const end = new Date(dateRange.endDate).setHours(23, 59, 59, 999);
            if (keyTime > end) return false;
          }
        }
      }

      return true;
    });
  }, [keys, search, selectedProviders, selectedStatuses, dateRange]);

  const activeCount = keys.filter((k) => k.status === 'ACTIVE').length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#27272a]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className={`${textScaleClass.heading} text-white tracking-tight`}>
              การจัดการ Provider API Keys
            </h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
              {activeCount} พร้อมใช้งาน
            </span>
          </div>
          <p className={`${textScaleClass.subheading} mt-0.5`}>
            คีย์ผู้ให้บริการเข้ารหัส AES-256, การจัดลำดับความสำคัญ (Priority), โควต้าคำขอ และระบบ Cooldown Failover อัตโนมัติ
          </p>
        </div>

        <div className="flex items-center gap-2">
          {userRole !== 'VIEWER' && (
            <button
              id="api-keys-add-btn"
              onClick={() => setIsAddOpen(true)}
              className={`flex items-center gap-1.5 rounded-lg bg-white hover:bg-zinc-200 text-black font-semibold transition-colors shadow-sm ${textScaleClass.btn}`}
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่ม API Key</span>
            </button>
          )}

          <button
            onClick={loadData}
            className="p-2 rounded-lg bg-[#121215] hover:bg-zinc-800 text-zinc-300 hover:text-white border border-[#27272a] transition-colors"
            title="รีเฟรช API Keys"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Enterprise Gateway Action Bar */}
      <GatewayActionBar
        title="Provider Key Vault"
        badge="Encrypted"
        totalCount={filtered.length}
        itemLabel="คีย์"
        onExportCsv={exportCsv}
        onRefresh={loadData}
        isLoading={loading}
      />

      {/* Security Compliance Banner */}
      <div className="p-3.5 rounded-xl bg-[#121215] border border-[#27272a] flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-semibold text-white flex items-center gap-2">
              เข้ารหัสปลอดภัยระดับฮาร์ดแวร์ (AES-256-CBC)
              <span className="text-[10px] px-1.5 py-0.2 bg-zinc-800 text-zinc-300 rounded font-mono">
                Zero Exposure Protocol
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              คีย์ตัวจริงจะไม่ถูกส่งกลับมายังเบราว์เซอร์เด็ดขาด ไม่เก็บใน LocalStorage และถูก Masking ซ่อนเสมอในบันทึกระบบ
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <TableFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="ค้นหาด้วยชื่อคีย์, ผู้ให้บริการ หรือคีย์ที่ซ่อน..."
        providers={providerOptions}
        selectedProviders={selectedProviders}
        onProvidersChange={setSelectedProviders}
        providerTitle="ผู้ให้บริการ"
        statuses={statusOptions}
        selectedStatuses={selectedStatuses}
        onStatusesChange={setSelectedStatuses}
        statusTitle="สถานะคีย์"
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        onReset={resetFilters}
        totalFilteredCount={filtered.length}
        totalCount={keys.length}
      />

      {/* Enterprise API Keys Table */}
      <div className="rounded-xl border border-zinc-800 bg-[#0e0e12] shadow-2xl overflow-hidden">
        <div className="px-4 py-2.5 bg-[#141418] border-b border-zinc-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <span className="font-semibold text-white font-mono flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              UPSTREAM PROVIDER KEYS VAULT
            </span>
            <span className="text-zinc-500 font-mono text-[11px]">
              แสดง {filtered.length} จาก {keys.length} คีย์
            </span>
          </div>
          {selectedKeyIds.length > 0 && userRole !== 'VIEWER' && (
            <div className="flex items-center gap-2 animate-in fade-in zoom-in-95 duration-150">
              <span className="text-[11px] text-emerald-400 font-mono">
                เลือกแล้ว {selectedKeyIds.length} รายการ
              </span>
              <button
                onClick={() => handleBulkToggle('ACTIVE')}
                className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-md font-medium transition-colors"
              >
                เปิดใช้งานที่เลือก
              </button>
              <button
                onClick={() => handleBulkToggle('DISABLED')}
                className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 rounded-md font-medium transition-colors"
              >
                ปิดใช้งานที่เลือก
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="border-b border-zinc-800 bg-[#16161c] text-zinc-400 font-mono text-[11px] uppercase tracking-wider select-none">
                <th className="py-3 px-4 font-semibold w-10">
                  <input
                    type="checkbox"
                    className="rounded border-zinc-700 bg-zinc-900/50 text-emerald-500 focus:ring-emerald-500/20 focus:ring-offset-0"
                    checked={filtered.length > 0 && selectedKeyIds.length === filtered.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedKeyIds(filtered.map(k => k.id));
                      } else {
                        setSelectedKeyIds([]);
                      }
                    }}
                  />
                </th>
                <th className="py-3 px-4 font-semibold">ผู้ให้บริการ & ชื่อคีย์</th>
                <th className="py-3 px-3 font-semibold">API KEY (MASKED)</th>
                <th className="py-3 px-3 font-semibold text-center">สถานะ</th>
                <th className="py-3 px-3 font-semibold text-center">PRIORITY</th>
                <th className="py-3 px-3 font-semibold text-right">คำขอสะสม</th>
                <th className="py-3 px-3 font-semibold">โควต้าคำขอ (QUOTA)</th>
                <th className="py-3 px-3 font-semibold">ใช้งานล่าสุด</th>
                <th className="py-3 px-4 font-semibold text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50 text-xs">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-14 text-center text-zinc-500 text-xs">
                    <div className="space-y-2">
                      <KeyRound className="w-8 h-8 text-zinc-600 mx-auto" />
                      <p className="text-zinc-300 font-medium">ไม่พบคีย์ที่ตรงกับเงื่อนไขการค้นหา</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((k) => {
                  const isTesting = testingKeyId === k.id;
                  const result = testResult?.id === k.id ? testResult : null;
                  const isCopied = copiedKeyId === k.id;
                  const percentUsed = Math.min(100, Math.round((k.quotaUsed / (k.quotaTotal || 1)) * 100));
                  const isSelected = selectedKeyIds.includes(k.id);

                  return (
                    <tr key={k.id} className={`transition-colors hover:bg-zinc-800/40 group ${isSelected ? 'bg-zinc-800/20' : ''}`}>
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          className="rounded border-zinc-700 bg-zinc-900/50 text-emerald-500 focus:ring-emerald-500/20 focus:ring-offset-0"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedKeyIds(prev => [...prev, k.id]);
                            } else {
                              setSelectedKeyIds(prev => prev.filter(id => id !== k.id));
                            }
                          }}
                        />
                      </td>
                      {/* Provider & Label */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white flex items-center gap-1.5">
                          <span>{k.label}</span>
                        </div>
                        <div className="text-[11px] font-mono text-zinc-400 mt-0.5">{k.providerName}</div>
                      </td>

                      {/* API Key (Strictly Masked with copy) */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <code className="font-mono text-zinc-200 bg-zinc-900 px-2 py-0.5 rounded text-xs border border-zinc-800">
                            {k.maskedKey}
                          </code>
                          <button
                            onClick={() => handleCopyMasked(k.id, k.maskedKey)}
                            className="p-1 rounded text-zinc-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                            title="คัดลอก Masked Key"
                          >
                            {isCopied ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        {k.lastError && (
                          <div className="text-[10px] text-rose-400 mt-1 max-w-xs truncate" title={k.lastError}>
                            Error: {k.lastError}
                          </div>
                        )}
                        {result && (
                          <div
                            className={`text-[10px] font-mono mt-1 font-semibold ${
                              result.valid ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {result.msg}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold border ${
                            k.status === 'ACTIVE'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : k.status === 'RATE_LIMITED'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : k.status === 'COOLDOWN'
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              k.status === 'ACTIVE'
                                ? 'bg-emerald-400'
                                : k.status === 'RATE_LIMITED'
                                ? 'bg-amber-400 animate-pulse'
                                : 'bg-rose-400'
                            }`}
                          />
                          {k.status === 'ACTIVE'
                            ? 'ACTIVE'
                            : k.status === 'RATE_LIMITED'
                            ? 'RATE LIMITED'
                            : k.status === 'COOLDOWN'
                            ? 'COOLDOWN'
                            : 'DISABLED'}
                        </span>
                      </td>

                      {/* Priority Tier */}
                      <td className="py-3 px-3 text-center">
                        <span className="font-mono text-zinc-300 bg-zinc-900 px-2 py-0.5 rounded text-xs border border-zinc-800 font-semibold">
                          #{k.priority}
                        </span>
                      </td>

                      {/* Requests Count */}
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-zinc-200">
                        {k.requestsCount.toLocaleString()}
                      </td>

                      {/* Quota Progress */}
                      <td className="py-3 px-3 min-w-[130px]">
                        <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1 font-mono">
                          <span>{k.quotaUsed.toLocaleString()} / {k.quotaTotal.toLocaleString()}</span>
                          <span className={percentUsed > 85 ? 'text-amber-400' : 'text-zinc-400'}>
                            {percentUsed}%
                          </span>
                        </div>
                        <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden border border-zinc-800">
                          <div
                            className={`h-full rounded-full transition-all ${
                              percentUsed > 85 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${percentUsed}%` }}
                          />
                        </div>
                      </td>

                      {/* Last Used */}
                      <td className="py-3 px-3 text-zinc-400 font-mono text-[11px]">
                        {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleTimeString('th-TH') : 'ไม่เคย'}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            id={`test-key-${k.id}`}
                            onClick={() => handleTestKey(k.id)}
                            disabled={isTesting}
                            className="p-1.5 rounded-md text-zinc-400 hover:text-cyan-400 hover:bg-zinc-800 transition-colors"
                            title="ทดสอบคีย์ด้วยคำขอจริง (Real API Ping)"
                          >
                            <Zap className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin text-cyan-400' : ''}`} />
                          </button>

                          {userRole !== 'VIEWER' && (
                            <>
                              <button
                                onClick={() => handleToggleKey(k)}
                                className={`p-1.5 rounded-md transition-colors ${
                                  k.status === 'ACTIVE'
                                    ? 'text-emerald-400 hover:bg-zinc-800'
                                    : 'text-zinc-500 hover:bg-zinc-800'
                                }`}
                                title={k.status === 'ACTIVE' ? 'ปิดใช้งานคีย์' : 'เปิดใช้งานคีย์'}
                              >
                                <Power className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => {
                                  setRotatingKey(k);
                                  setRotateRawSecret('');
                                }}
                                className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                                title="หมุนเวียนคีย์ (Rotate Secret)"
                              >
                                <RotateCw className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          {userRole === 'ADMIN' && (
                            <button
                              onClick={() => handleDelete(k.id)}
                              className="p-1.5 rounded-md text-rose-400 hover:text-rose-200 hover:bg-rose-950/40 transition-colors"
                              title="ลบคีย์"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Key Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-[#121215] border border-[#27272a] rounded-2xl p-6 shadow-2xl relative text-left">
            <button
              onClick={() => setIsAddOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-base font-semibold text-white mb-1">ลงทะเบียน API Key ใหม่</h2>
            <p className="text-xs text-zinc-400 mb-4">
              จัดเก็บอย่างปลอดภัยด้วยการเข้ารหัส AES-256 ข้อความธรรมดาจะถูกทำลายทันทีหลังเข้ารหัส
            </p>

            <form onSubmit={handleCreateKey} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">ผู้ให้บริการปลายทาง</label>
                <select
                  required
                  value={newKeyForm.providerId}
                  onChange={(e) => setNewKeyForm({ ...newKeyForm, providerId: e.target.value })}
                  className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500"
                >
                  {providers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.slug})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">ป้ายกำกับคีย์ (Key Label)</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น Free Tier Cluster Alpha #1"
                  value={newKeyForm.label}
                  onChange={(e) => setNewKeyForm({ ...newKeyForm, label: e.target.value })}
                  className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">API Secret / Key จริง</label>
                <input
                  type="password"
                  required
                  placeholder="sk-... หรือ AIzaSy..."
                  value={newKeyForm.rawKey}
                  onChange={(e) => setNewKeyForm({ ...newKeyForm, rawKey: e.target.value })}
                  className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-zinc-500"
                />
                <span className="text-[11px] text-zinc-500 mt-1 block">
                  เข้ารหัสระดับฐานข้อมูลทันที ไม่แสดงตัวเต็มในระบบเด็ดขาด
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">ลำดับความสำคัญ (1 = สูงสุด)</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={newKeyForm.priority}
                    onChange={(e) => setNewKeyForm({ ...newKeyForm, priority: Number(e.target.value) })}
                    className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">โควต้าคำขอรายวัน</label>
                  <input
                    type="number"
                    value={newKeyForm.quotaTotal}
                    onChange={(e) => setNewKeyForm({ ...newKeyForm, quotaTotal: Number(e.target.value) })}
                    className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 text-xs font-medium hover:bg-zinc-700 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-white hover:bg-zinc-200 text-black text-xs font-semibold transition-colors"
                >
                  เข้ารหัสและบันทึก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rotate Key Modal */}
      {rotatingKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-[#121215] border border-[#27272a] rounded-2xl p-6 shadow-2xl relative text-left">
            <button
              onClick={() => setRotatingKey(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-base font-semibold text-white mb-1">หมุนเวียนคีย์ (Rotate Secret)</h2>
            <p className="text-xs text-zinc-400 mb-4">
              กำลังหมุนเวียนคีย์สำหรับ: <strong className="text-white">{rotatingKey.label}</strong> ({rotatingKey.maskedKey})
            </p>

            <form onSubmit={handleRotateKey} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  API Key ใหม่ (เว้นว่างไว้เพื่อสร้างแบบสุ่มอัตโนมัติ)
                </label>
                <input
                  type="password"
                  placeholder="กรอกคีย์ความลับใหม่..."
                  value={rotateRawSecret}
                  onChange={(e) => setRotateRawSecret(e.target.value)}
                  className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRotatingKey(null)}
                  className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 text-xs font-medium hover:bg-zinc-700 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-semibold transition-colors"
                >
                  ยืนยันการหมุนเวียนคีย์
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

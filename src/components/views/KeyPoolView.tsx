import React, { useEffect, useState } from 'react';
import {
  RotateCw,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  RefreshCw,
  Layers,
  ShieldAlert,
  Play,
  Activity,
  Sliders,
  Sparkles,
  Search,
  Filter,
  Check,
  XCircle,
} from 'lucide-react';
import { ProviderPoolGroup, KeyPoolItem, KeyHealthVisualStatus, UserRole } from '../../types';
import { api } from '../../lib/api';
import { useDisplay } from '../../context/DisplayContext';
import { GatewayActionBar } from '../common/GatewayActionBar';

interface KeyPoolViewProps {
  userRole: UserRole;
}

export const KeyPoolView: React.FC<KeyPoolViewProps> = ({ userRole }) => {
  const { textScaleClass } = useDisplay();
  const [pools, setPools] = useState<ProviderPoolGroup[]>([]);
  const [strategy, setStrategy] = useState<string>('ROUND_ROBIN');
  const [cooldownSec, setCooldownSec] = useState<number>(180);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Healthy' | 'Rate-Limited' | 'Failed'>('ALL');
  const [searchKey, setSearchKey] = useState('');
  const [reactivatingKeyId, setReactivatingKeyId] = useState<string | null>(null);

  // Simulator State
  const [simProvider, setSimProvider] = useState<string>('');
  const [simStrategy, setSimStrategy] = useState<string>('ROUND_ROBIN');
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState<{
    provider: string;
    strategyApplied: string;
    selectedKey: any;
    reasoning: string;
  } | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await api.getKeyPool();
      setPools(data.pools);
      setStrategy(data.globalStrategy);
      setCooldownSec(data.cooldownDurationSec);
      if (data.pools.length > 0 && !simProvider) {
        setSimProvider(data.pools[0].providerId);
        setSimStrategy(data.globalStrategy);
      }
    } catch (err) {
      console.error('Failed to load key pool', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateStrategy = async (newStrategy: string) => {
    if (userRole === 'VIEWER') return;
    try {
      await api.updateSettings({ keyRotationStrategy: newStrategy as any });
      setStrategy(newStrategy);
      setSimStrategy(newStrategy);
      loadData();
    } catch (err) {
      console.error('Failed to update strategy', err);
    }
  };

  const handleRunSimulation = async () => {
    try {
      setSimulating(true);
      const res = await api.simulateKeyPool(simProvider, simStrategy);
      setSimResult(res);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Simulation error');
    } finally {
      setSimulating(false);
    }
  };

  const handleReactivateKey = async (keyId: string) => {
    if (userRole === 'VIEWER') return;
    try {
      setReactivatingKeyId(keyId);
      await api.reactivateApiKey(keyId);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to reactivate key');
    } finally {
      setReactivatingKeyId(null);
    }
  };

  const exportCsv = () => {
    const headers = [
      'Provider',
      'Key Label',
      'Masked Key',
      'Visual Status',
      'Raw Status',
      'Priority',
      'Recent Success Rate',
      'Recent Calls',
      'Fail Count',
    ];
    const rows: string[][] = [];
    pools.forEach((p) => {
      p.keys.forEach((k) => {
        rows.push([
          `"${p.providerName}"`,
          `"${k.label}"`,
          `"${k.maskedKey}"`,
          `"${k.healthStatus || (k.status === 'ACTIVE' ? 'Healthy' : k.status === 'RATE_LIMITED' ? 'Rate-Limited' : 'Failed')}"`,
          `"${k.status}"`,
          String(k.priority),
          `${k.recentActivity?.successRate ?? 100}%`,
          String(k.recentActivity?.totalRecent ?? k.requestsCount),
          String(k.failCount),
        ]);
      });
    });
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `key_pools_health_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const strategies = [
    {
      id: 'ROUND_ROBIN',
      name: 'วนตามลำดับ (Round Robin)',
      desc: 'หมุนเวียนคีย์สุขภาพดีเท่าๆ กันในพูล (คีย์ 1 -> คีย์ 2 -> คีย์ 3 -> คีย์ 1)',
    },
    {
      id: 'LEAST_USED',
      name: 'ใช้น้อยสุดก่อน (Least Used)',
      desc: 'ส่งคำขอไปยังคีย์ที่มีจำนวนการใช้งานสะสมน้อยที่สุดเพื่อกระจายภาระอย่างสมดุล',
    },
    {
      id: 'RANDOM',
      name: 'สุ่มอย่างสม่ำเสมอ (Randomized)',
      desc: 'กระจายคำขอแบบสุ่มทางสถิติไปยังคีย์ที่พร้อมใช้งานทั้งหมด',
    },
    {
      id: 'PRIORITY',
      name: 'ลำดับความสำคัญ (Priority Tier)',
      desc: 'ใช้คีย์ Tier #1 เสมอ หากคีย์หลักล้มเหลวจึงสลับไปยัง Tier #2',
    },
    {
      id: 'FAILOVER',
      name: 'สลับหนีข้อผิดพลาดทันที (Failover)',
      desc: 'ตรวจจับ HTTP 429 หรือ 5xx ได้ทันที และสลับเส้นทางไปยังคีย์สำรองพร้อมตั้งคูลดาวน์',
    },
  ];

  // Global key counts by visual status
  let totalKeysCount = 0;
  let healthyKeysCount = 0;
  let rateLimitedKeysCount = 0;
  let failedKeysCount = 0;

  pools.forEach((p) => {
    p.keys.forEach((k) => {
      totalKeysCount++;
      const vStatus = k.healthStatus || (k.status === 'ACTIVE' ? 'Healthy' : k.status === 'RATE_LIMITED' ? 'Rate-Limited' : 'Failed');
      if (vStatus === 'Healthy') healthyKeysCount++;
      else if (vStatus === 'Rate-Limited') rateLimitedKeysCount++;
      else failedKeysCount++;
    });
  });

  // Filter keys for display
  const filteredPools = pools.map((p) => {
    const keys = p.keys.filter((k) => {
      const vStatus = k.healthStatus || (k.status === 'ACTIVE' ? 'Healthy' : k.status === 'RATE_LIMITED' ? 'Rate-Limited' : 'Failed');
      const matchesStatus = statusFilter === 'ALL' || vStatus === statusFilter;
      const matchesSearch =
        searchKey === '' ||
        k.label.toLowerCase().includes(searchKey.toLowerCase()) ||
        k.maskedKey.toLowerCase().includes(searchKey.toLowerCase()) ||
        p.providerName.toLowerCase().includes(searchKey.toLowerCase());
      return matchesStatus && matchesSearch;
    });
    return { ...p, keys };
  });

  // Render Visual Status Badge Helper
  const renderStatusBadge = (key: KeyPoolItem, isCompact = false) => {
    const vStatus: KeyHealthVisualStatus =
      key.healthStatus ||
      (key.status === 'ACTIVE'
        ? 'Healthy'
        : key.status === 'RATE_LIMITED'
        ? 'Rate-Limited'
        : 'Failed');

    if (vStatus === 'Healthy') {
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-semibold rounded-full border transition-colors ${
            isCompact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
          } bg-emerald-500/10 text-emerald-400 border-emerald-500/20`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span>Healthy</span>
          {!isCompact && <span className="text-[10px] opacity-80">(พร้อมใช้งาน)</span>}
        </span>
      );
    }

    if (vStatus === 'Rate-Limited') {
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-semibold rounded-full border transition-colors ${
            isCompact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
          } bg-amber-500/10 text-amber-400 border-amber-500/20`}
        >
          <Clock className="w-3 h-3 text-amber-400 shrink-0" />
          <span>Rate-Limited</span>
          {!isCompact && <span className="text-[10px] opacity-80">(ติดลิมิต/คูลดาวน์)</span>}
        </span>
      );
    }

    return (
      <span
        className={`inline-flex items-center gap-1.5 font-semibold rounded-full border transition-colors ${
          isCompact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
        } bg-rose-500/10 text-rose-400 border-rose-500/20`}
      >
        <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
        <span>Failed</span>
        {!isCompact && <span className="text-[10px] opacity-80">(ล้มเหลว/ผิดพลาด)</span>}
      </span>
    );
  };

  // Render recent log activity dots
  const renderRecentActivityDots = (key: KeyPoolItem) => {
    const statuses = key.recentActivity?.recentStatuses || [200, 200, 200, 200, 200];
    const successRate = key.recentActivity?.successRate ?? 100;

    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          {statuses.slice(-5).map((st, i) => (
            <span
              key={i}
              className={`w-2 h-2 rounded-full cursor-help ${
                st === 200
                  ? 'bg-emerald-400'
                  : st === 429
                  ? 'bg-amber-400'
                  : 'bg-rose-500'
              }`}
              title={`คำขอล่าสุด #${i + 1}: HTTP ${st}`}
            />
          ))}
        </div>
        <span
          className={`text-[11px] font-mono font-bold ${
            successRate >= 90
              ? 'text-emerald-400'
              : successRate >= 60
              ? 'text-amber-400'
              : 'text-rose-400'
          }`}
        >
          {successRate}% สำเร็จ
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#27272a]">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className={`${textScaleClass.heading} text-white tracking-tight`}>
              พูล API Key & การจัดสรรโหลด (Key Pool Engine)
            </h1>
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                🟢 {healthyKeysCount} Healthy
              </span>
              {rateLimitedKeysCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
                  🟡 {rateLimitedKeysCount} Rate-Limited
                </span>
              )}
              {failedKeysCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-semibold">
                  🔴 {failedKeysCount} Failed
                </span>
              )}
            </div>
          </div>
          <p className={`${textScaleClass.subheading} mt-0.5`}>
            ติดตามสถานะสุขภาพคีย์แบบเรียลไทม์จากประวัติคำขอ (Healthy, Rate-Limited, Failed) และระบบจัดสรรโหลดอัตโนมัติ
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="p-2 rounded-lg bg-[#121215] hover:bg-zinc-800 text-zinc-300 hover:text-white border border-[#27272a] transition-colors"
            title="รีเฟรชสถานะพูลคีย์"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Enterprise Gateway Action Bar */}
      <GatewayActionBar
        title="Load Balancer Clusters"
        badge="Live Routing"
        totalCount={pools.length}
        itemLabel="คลัสเตอร์"
        onExportCsv={exportCsv}
        onRefresh={loadData}
        isLoading={loading}
      />

      {/* Visual Status Legend & Filter Bar */}
      <div className="p-3.5 rounded-xl bg-[#121215] border border-[#27272a] flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-medium text-zinc-400 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            ตัวกรองสถานะ:
          </span>

          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors border ${
              statusFilter === 'ALL'
                ? 'bg-zinc-800 text-white border-zinc-600 shadow-xs'
                : 'bg-[#18181b] text-zinc-400 border-[#27272a] hover:text-zinc-200'
            }`}
          >
            ทั้งหมด ({totalKeysCount})
          </button>

          <button
            onClick={() => setStatusFilter('Healthy')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors border flex items-center gap-1.5 ${
              statusFilter === 'Healthy'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-xs'
                : 'bg-[#18181b] text-zinc-400 border-[#27272a] hover:text-emerald-400'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Healthy ({healthyKeysCount})
          </button>

          <button
            onClick={() => setStatusFilter('Rate-Limited')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors border flex items-center gap-1.5 ${
              statusFilter === 'Rate-Limited'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-xs'
                : 'bg-[#18181b] text-zinc-400 border-[#27272a] hover:text-amber-400'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            Rate-Limited ({rateLimitedKeysCount})
          </button>

          <button
            onClick={() => setStatusFilter('Failed')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors border flex items-center gap-1.5 ${
              statusFilter === 'Failed'
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-xs'
                : 'bg-[#18181b] text-zinc-400 border-[#27272a] hover:text-rose-400'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            Failed ({failedKeysCount})
          </button>
        </div>

        {/* Quick Search */}
        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ค้นหาชื่อคีย์ หรือ Masked Key..."
            value={searchKey}
            onChange={(e) => setSearchKey(e.target.value)}
            className="w-full bg-[#18181b] border border-[#27272a] rounded-lg pl-8 pr-3 py-1 text-xs text-zinc-200 placeholder-zinc-400 focus:outline-none focus:border-zinc-500"
          />
        </div>
      </div>

      {/* Rotation Strategies Selector */}
      <div className="p-4 rounded-xl bg-[#121215] border border-[#27272a] space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-semibold text-white">กลยุทธ์การหมุนเวียนคีย์ (Active Rotation Strategy)</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              กำหนดวิธีการจัดสรรคำขอไปยังคีย์ต่างๆ ภายในพูลของผู้ให้บริการแต่ละราย
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 font-semibold">
            {strategy}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {strategies.map((s) => {
            const isSelected = strategy === s.id;
            return (
              <button
                key={s.id}
                id={`strategy-btn-${s.id.toLowerCase()}`}
                onClick={() => handleUpdateStrategy(s.id)}
                disabled={userRole === 'VIEWER'}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-[#1e1e24] border-zinc-500 text-white shadow-md ring-1 ring-zinc-500'
                    : 'bg-[#18181b] border-[#27272a] text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold">{s.name}</span>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                </div>
                <p className="text-[11px] leading-relaxed text-zinc-400">{s.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive Key Pool Routing Simulator */}
      <div className="p-4 rounded-xl bg-[#121215] border border-[#27272a] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-white">ระบบจำลองการจ่ายคำขอในพูลคีย์ (Routing Simulator)</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                จำลองการส่งคำขอเข้ามาเพื่อทดสอบและตรวจสอบตรรกะการหมุนเวียนคีย์และ Failover
              </p>
            </div>
          </div>

          <button
            id="simulate-run-btn"
            onClick={handleRunSimulation}
            disabled={simulating}
            className={`flex items-center gap-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-semibold transition-colors disabled:opacity-50 ${textScaleClass.btn}`}
          >
            <Play className="w-3.5 h-3.5 fill-black" />
            <span>{simulating ? 'กำลังจำลอง...' : 'จำลองการส่งคำขอ (Simulate)'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">เลือกพูลของผู้ให้บริการ</label>
            <select
              value={simProvider}
              onChange={(e) => setSimProvider(e.target.value)}
              className={`w-full bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-zinc-500 ${textScaleClass.input}`}
            >
              {pools.map((p) => (
                <option key={p.providerId} value={p.providerId}>
                  {p.providerName} (พร้อม {p.activeKeys}, ติดลิมิต {p.rateLimitedKeys})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">กลยุทธ์การหมุนเวียนที่ต้องการทดสอบ</label>
            <select
              value={simStrategy}
              onChange={(e) => setSimStrategy(e.target.value)}
              className={`w-full bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-zinc-500 ${textScaleClass.input}`}
            >
              {strategies.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {simResult && (
          <div className="p-3.5 rounded-xl bg-[#18181b] border border-[#27272a] space-y-2.5 animate-in fade-in">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                จำลองการส่งคำขอสำเร็จ
              </span>
              <span className="font-mono text-xs text-zinc-400">
                กลยุทธ์: {simResult.strategyApplied}
              </span>
            </div>

            <div className="text-xs text-zinc-200">
              คีย์ที่ถูกเลือกประมวลผล:{' '}
              {simResult.selectedKey ? (
                <strong className="text-white font-mono bg-[#121215] border border-[#27272a] px-2 py-0.5 rounded">
                  {simResult.selectedKey.label} ({simResult.selectedKey.maskedKey})
                </strong>
              ) : (
                <span className="text-rose-400 font-semibold">ไม่มีคีย์ที่พร้อมใช้งาน (จำเป็นต้องสลับสำรอง Failover)</span>
              )}
            </div>

            <p className="text-xs text-zinc-400 bg-[#121215] p-2.5 rounded-lg border border-[#27272a] font-mono leading-relaxed">
              {simResult.reasoning}
            </p>
          </div>
        )}
      </div>

      {/* Enterprise Key Pool Overview Table */}
      <div className="overflow-x-auto rounded-xl border border-[#27272a] bg-[#121215] shadow-lg">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className={`border-b border-[#27272a] bg-[#16161a] text-zinc-400 font-semibold uppercase tracking-wider ${textScaleClass.th}`}>
              <th>ผู้ให้บริการ AI (Provider Pool)</th>
              <th>สถานะ Healthy (พร้อม)</th>
              <th>Rate-Limited (ติดลิมิต)</th>
              <th>Failed (ผิดพลาด)</th>
              <th>กลยุทธ์</th>
              <th>รายการคีย์ในพูล (พร้อมสถานะภาพรวม)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#27272a]/60">
            {pools.map((pool) => {
              const poolHealthy = pool.keys.filter(
                (k) => (k.healthStatus || (k.status === 'ACTIVE' ? 'Healthy' : k.status === 'RATE_LIMITED' ? 'Rate-Limited' : 'Failed')) === 'Healthy'
              ).length;
              const poolRateLimited = pool.keys.filter(
                (k) => (k.healthStatus || (k.status === 'ACTIVE' ? 'Healthy' : k.status === 'RATE_LIMITED' ? 'Rate-Limited' : 'Failed')) === 'Rate-Limited'
              ).length;
              const poolFailed = pool.keys.filter(
                (k) => (k.healthStatus || (k.status === 'ACTIVE' ? 'Healthy' : k.status === 'RATE_LIMITED' ? 'Rate-Limited' : 'Failed')) === 'Failed'
              ).length;

              return (
                <tr key={pool.providerId} className="transition-colors hover:bg-[#18181c]">
                  <td className={`${textScaleClass.td} font-semibold text-white`}>
                    {pool.providerName}
                  </td>
                  <td className={`${textScaleClass.td} font-mono text-emerald-400 font-bold`}>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>{poolHealthy} คีย์</span>
                    </div>
                  </td>
                  <td className={`${textScaleClass.td} font-mono text-amber-400`}>
                    {poolRateLimited > 0 ? (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs">
                        {poolRateLimited} คีย์
                      </span>
                    ) : (
                      <span className="text-zinc-500 text-xs">0 คีย์</span>
                    )}
                  </td>
                  <td className={`${textScaleClass.td} font-mono text-rose-400`}>
                    {poolFailed > 0 ? (
                      <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs">
                        {poolFailed} คีย์
                      </span>
                    ) : (
                      <span className="text-zinc-500 text-xs">0 คีย์</span>
                    )}
                  </td>
                  <td className={`${textScaleClass.td} font-mono text-zinc-300 text-xs`}>
                    <span className="bg-[#18181b] px-2 py-0.5 rounded border border-[#27272a]">
                      {strategy}
                    </span>
                  </td>
                  <td className={textScaleClass.td}>
                    <div className="flex flex-wrap gap-1.5">
                      {pool.keys.map((k) => (
                        <span
                          key={k.id}
                          className="inline-flex items-center gap-1"
                          title={`คีย์: ${k.label} | อัตราสำเร็จล่าสุด: ${k.recentActivity?.successRate ?? 100}%`}
                        >
                          {renderStatusBadge(k, true)}
                          <span className="text-xs font-mono text-zinc-300">
                            {k.label}
                          </span>
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Provider Pools Detail Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">
            รายละเอียดคลัสเตอร์พูลคีย์ ({filteredPools.length})
          </h2>
          <span className="text-xs text-zinc-400">
            แสดงสถานะจากประวัติการส่งคำขอล่าสุด
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredPools.map((pool) => (
            <div
              key={pool.providerId}
              className="p-4 rounded-xl bg-[#121215] border border-[#27272a] space-y-3"
            >
              <div className="flex items-center justify-between border-b border-[#27272a] pb-2.5">
                <div>
                  <h3 className="text-sm font-semibold text-white">{pool.providerName}</h3>
                  <span className="text-xs text-zinc-400">
                    กลยุทธ์คลัสเตอร์:{' '}
                    <strong className="text-zinc-200 font-mono">{strategy}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                    Healthy {pool.keys.filter((k) => (k.healthStatus || (k.status === 'ACTIVE' ? 'Healthy' : k.status === 'RATE_LIMITED' ? 'Rate-Limited' : 'Failed')) === 'Healthy').length}
                  </span>
                  {pool.keys.some((k) => (k.healthStatus || (k.status === 'ACTIVE' ? 'Healthy' : k.status === 'RATE_LIMITED' ? 'Rate-Limited' : 'Failed')) === 'Rate-Limited') && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
                      Rate-Limited {pool.keys.filter((k) => (k.healthStatus || (k.status === 'ACTIVE' ? 'Healthy' : k.status === 'RATE_LIMITED' ? 'Rate-Limited' : 'Failed')) === 'Rate-Limited').length}
                    </span>
                  )}
                  {pool.keys.some((k) => (k.healthStatus || (k.status === 'ACTIVE' ? 'Healthy' : k.status === 'RATE_LIMITED' ? 'Rate-Limited' : 'Failed')) === 'Failed') && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-semibold">
                      Failed {pool.keys.filter((k) => (k.healthStatus || (k.status === 'ACTIVE' ? 'Healthy' : k.status === 'RATE_LIMITED' ? 'Rate-Limited' : 'Failed')) === 'Failed').length}
                    </span>
                  )}
                </div>
              </div>

              {/* Keys in this Pool */}
              <div className="space-y-2.5">
                {pool.keys.length === 0 ? (
                  <div className="p-4 text-center text-xs text-zinc-500 bg-[#18181b] rounded-lg border border-[#27272a]">
                    ไม่พบคีย์ที่ตรงกับตัวกรองในคลัสเตอร์นี้
                  </div>
                ) : (
                  pool.keys.map((k, idx) => {
                    const vStatus: KeyHealthVisualStatus =
                      k.healthStatus ||
                      (k.status === 'ACTIVE'
                        ? 'Healthy'
                        : k.status === 'RATE_LIMITED'
                        ? 'Rate-Limited'
                        : 'Failed');

                    return (
                      <div
                        key={k.id}
                        className={`p-3 rounded-lg border transition-all ${
                          vStatus === 'Healthy'
                            ? 'bg-[#18181b] border-[#27272a] hover:border-emerald-500/30'
                            : vStatus === 'Rate-Limited'
                            ? 'bg-amber-950/20 border-amber-900/40 hover:border-amber-700/60'
                            : 'bg-rose-950/20 border-rose-900/40 hover:border-rose-700/60'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                          {/* Key Identity */}
                          <div className="flex items-start gap-2.5">
                            <span className="w-5 h-5 rounded bg-zinc-800 flex items-center justify-center font-mono text-[10px] text-zinc-300 shrink-0 mt-0.5">
                              #{idx + 1}
                            </span>
                            <div>
                              <div className="font-semibold text-white flex items-center gap-2 flex-wrap">
                                <span>{k.label}</span>
                                <span className="text-[11px] font-mono text-zinc-400">
                                  (Priority {k.priority})
                                </span>
                              </div>
                              <div className="font-mono text-xs text-zinc-400 mt-0.5 flex items-center gap-2">
                                <span>{k.maskedKey}</span>
                                <span className="text-zinc-600">•</span>
                                <span className="text-[11px] text-zinc-400">
                                  เรียกใช้: {k.requestsCount} ครั้ง
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Visual Status Indicator & Action */}
                          <div className="flex flex-col sm:items-end gap-1.5 shrink-0">
                            <div className="flex items-center gap-2">
                              {renderStatusBadge(k)}
                              {vStatus !== 'Healthy' && userRole !== 'VIEWER' && (
                                <button
                                  onClick={() => handleReactivateKey(k.id)}
                                  disabled={reactivatingKeyId === k.id}
                                  className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-600 hover:bg-emerald-500 text-black transition-colors disabled:opacity-50"
                                  title="รีเซ็ตคูลดาวน์และคืนสถานะ Healthy"
                                >
                                  {reactivatingKeyId === k.id ? 'กำลังฟื้นฟู...' : 'ฟื้นฟูคีย์'}
                                </button>
                              )}
                            </div>

                            {/* Recent Activity Telemetry */}
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-zinc-400">กิจกรรมล่าสุด:</span>
                              {renderRecentActivityDots(k)}
                            </div>
                          </div>
                        </div>

                        {/* Cooldown or Error diagnostics */}
                        {k.cooldownUntil && (
                          <div className="mt-2 pt-2 border-t border-amber-900/30 flex items-center justify-between text-[11px] text-amber-400 font-mono">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              <span>อยู่ในช่วงคูลดาวน์ (Cooldown Active)</span>
                            </div>
                            <span>
                              ถึง: {new Date(k.cooldownUntil).toLocaleTimeString('th-TH')}
                            </span>
                          </div>
                        )}

                        {k.lastError && (
                          <div className="mt-2 pt-2 border-t border-rose-900/30 text-[11px] text-rose-300 font-mono flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                            <span className="truncate">{k.lastError}</span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rotation Audit Tab Section */}
      <div className="pt-6 border-t border-[#27272a]">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-emerald-400" />
          <h2 className="text-lg font-semibold text-white">Rotation Audit Logs (ประวัติการสลับคีย์อัตโนมัติ)</h2>
        </div>
        <p className="text-xs text-zinc-400 mb-4">
          บันทึกการทำงานของระบบ Load Balancer เมื่อมีการสลับคีย์สำรอง (Failover) แบบอัตโนมัติ
        </p>
        
        <RotationAuditTable />
      </div>
    </div>
  );
};

const RotationAuditTable: React.FC = () => {
  const [audits, setAudits] = useState<import('../../types').RotationAuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAudits = async () => {
      try {
        const data = await api.getRotationAudits();
        setAudits(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAudits();
  }, []);

  if (loading) return <div className="text-xs text-zinc-500 py-4">กำลังโหลด...</div>;
  if (audits.length === 0) return <div className="text-xs text-zinc-500 py-4">ไม่มีประวัติการสลับคีย์</div>;

  return (
    <div className="overflow-x-auto rounded-xl border border-[#27272a] bg-[#121215]">
      <table className="w-full text-left border-collapse whitespace-nowrap">
        <thead>
          <tr className="border-b border-[#27272a] bg-[#16161a] text-zinc-400 font-semibold uppercase tracking-wider text-[11px]">
            <th className="px-4 py-3">เวลา (Timestamp)</th>
            <th className="px-4 py-3">ผู้ให้บริการ (Provider)</th>
            <th className="px-4 py-3">โมเดล (Model)</th>
            <th className="px-4 py-3 text-rose-400">คีย์ต้นทาง (ล้มเหลว)</th>
            <th className="px-4 py-3 text-emerald-400">คีย์เป้าหมาย (สลับไปใช้)</th>
            <th className="px-4 py-3">รหัสข้อผิดพลาด (Error)</th>
            <th className="px-4 py-3">สาเหตุ (Reason)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#27272a]/60">
          {audits.map((log) => (
            <tr key={log.id} className="transition-colors hover:bg-[#18181c]">
              <td className="px-4 py-3 font-mono text-zinc-300 text-xs">
                {new Date(log.timestamp).toLocaleString('th-TH')}
              </td>
              <td className="px-4 py-3 font-semibold text-white text-xs">{log.providerId}</td>
              <td className="px-4 py-3 font-mono text-zinc-300 text-xs">{log.modelId}</td>
              <td className="px-4 py-3 font-mono text-rose-300 text-xs">{log.sourceKeyId}</td>
              <td className="px-4 py-3 font-mono text-emerald-300 text-xs flex items-center gap-2">
                <ArrowRight className="w-3.5 h-3.5 text-zinc-600" />
                {log.targetKeyId}
              </td>
              <td className="px-4 py-3 font-mono text-amber-400 text-xs">HTTP {log.triggerErrorCode}</td>
              <td className="px-4 py-3 text-zinc-400 text-xs">{log.triggerReason}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

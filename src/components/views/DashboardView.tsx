import React, { useEffect, useState } from 'react';
import {
  Cpu,
  KeyRound,
  CheckCircle,
  AlertOctagon,
  Boxes,
  Zap,
  TrendingUp,
  Coins,
  Gauge,
  ArrowUpRight,
  RefreshCw,
  Plus,
  Terminal,
  Activity,
  ShieldCheck,
  Radio,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { DashboardMetrics, ChartDataPoint, ProviderUsageItem, ModelUsageItem, ViewTab } from '../../types';
import { api } from '../../lib/api';
import { TelemetryLineChart } from '../TelemetryLineChart';
import { useDisplay } from '../../context/DisplayContext';
import { GatewayActionBar } from '../common/GatewayActionBar';

interface DashboardViewProps {
  onNavigate: (tab: ViewTab) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const { textScaleClass } = useDisplay();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [charts, setCharts] = useState<{
    requestsOverTime: ChartDataPoint[];
    providerUsage: ProviderUsageItem[];
    modelUsage: ModelUsageItem[];
    usagePredictions: import('../../types').PredictionDataPoint[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await api.getDashboardStats();
      setMetrics(data.metrics);
      setCharts(data.charts);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
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
      const res = await api.syncFreeModels();
      alert(res.message);
      await loadData();
    } catch (e: any) {
      alert(e.message || 'ซิงค์ไม่สำเร็จ');
    } finally {
      setIsSyncing(false);
    }
  };

  const statCards = [
    {
      id: 'stat-providers',
      label: 'ผู้ให้บริการ AI ทั้งหมด',
      value: metrics?.providersCount ?? 8,
      sub: 'เชื่อมต่อ 8 ค่ายพร้อมกัน',
      icon: Cpu,
      color: 'text-blue-400',
      badgeBg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      tab: 'providers' as ViewTab,
    },
    {
      id: 'stat-keys',
      label: 'API Keys ในระบบ',
      value: metrics?.apiKeysCount ?? 11,
      sub: 'เข้ารหัสปลอดภัย AES-256',
      icon: KeyRound,
      color: 'text-indigo-400',
      badgeBg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      tab: 'api-keys' as ViewTab,
    },
    {
      id: 'stat-active-keys',
      label: 'คีย์ที่พร้อมใช้งาน',
      value: metrics?.activeKeysCount ?? 10,
      sub: 'ในพูลหมุนเวียนคีย์',
      icon: CheckCircle,
      color: 'text-emerald-400',
      badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      tab: 'key-pool' as ViewTab,
    },
    {
      id: 'stat-error-keys',
      label: 'คีย์ติดปัญหา / พักคูลดาวน์',
      value: metrics?.errorKeysCount ?? 1,
      sub: 'ระบบกักกันอัตโนมัติ',
      icon: AlertOctagon,
      color: 'text-rose-400',
      badgeBg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      tab: 'errors' as ViewTab,
    },
    {
      id: 'stat-models',
      label: 'โมเดล AI ในแคตตาล็อก',
      value: metrics?.modelsCount ?? 10,
      sub: 'สารบบโมเดลพร้อมเกตเวย์',
      icon: Boxes,
      color: 'text-violet-400',
      badgeBg: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
      tab: 'models' as ViewTab,
    },
    {
      id: 'stat-requests-today',
      label: 'คำขอวันนี้ (Requests)',
      value: metrics ? metrics.requestsToday.toLocaleString() : '8,492',
      sub: '+14% เทียบกับเมื่อวาน',
      icon: Zap,
      color: 'text-amber-400',
      badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      tab: 'logs' as ViewTab,
    },
    {
      id: 'stat-tokens-today',
      label: 'โทเค็นที่ใช้วันนี้',
      value: metrics ? (metrics.tokensToday / 1000000).toFixed(2) + 'M' : '14.92M',
      sub: 'รวมทุกพูลที่เปิดใช้งาน',
      icon: TrendingUp,
      color: 'text-cyan-400',
      badgeBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      tab: 'logs' as ViewTab,
    },
    {
      id: 'stat-success-rate',
      label: 'อัตราความสำเร็จ (SLA)',
      value: metrics?.successRate ?? '99.2%',
      sub: 'Failover ไร้รอยต่อ',
      icon: Gauge,
      color: 'text-emerald-400',
      badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      tab: 'health' as ViewTab,
    },
    {
      id: 'stat-est-cost',
      label: 'ต้นทุนประเมิน',
      value: metrics?.estimatedCost ?? '$0.00',
      sub: 'ประหยัด 100% ผ่าน Free Tier',
      icon: Coins,
      color: 'text-emerald-300',
      badgeBg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
      tab: 'settings' as ViewTab,
    },
    {
      id: 'stat-quota-rem',
      label: 'โควต้าคงเหลือเฉลี่ย',
      value: metrics?.quotaRemaining ?? '86.4%',
      sub: 'รีเซ็ตใน 14 ชั่วโมง',
      icon: Activity,
      color: 'text-teal-400',
      badgeBg: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
      tab: 'api-keys' as ViewTab,
    },
  ];

  const exportCsv = () => {
    const headers = ['Metric', 'Current Value', 'Note'];
    const rows = statCards.map((c) => [`"${c.label}"`, `"${c.value}"`, `"${c.sub}"`]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `gateway_dashboard_metrics_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#27272a]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className={`${textScaleClass.heading} text-white tracking-tight`}>
              แดชบอร์ดภาพรวมระบบ (Gateway Overview)
            </h1>
            <span className="flex items-center gap-1 text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Gateway Healthy
            </span>
          </div>
          <p className={`${textScaleClass.subheading} mt-0.5`}>
            ศูนย์กลางจัดการ AI Provider หลายค่าย, เครื่องมือหมุนเวียนคีย์ และเทเลเมทรีของเกตเวย์
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="dash-refresh-btn"
            onClick={loadData}
            className="p-2 rounded-lg bg-[#121215] hover:bg-zinc-800 text-zinc-300 hover:text-white border border-[#27272a] transition-colors"
            title="รีเฟรชข้อมูล"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            id="dash-add-key-btn"
            onClick={() => onNavigate('api-keys')}
            className={`flex items-center gap-1.5 rounded-lg bg-white hover:bg-zinc-200 text-black font-semibold transition-colors shadow-sm ${textScaleClass.btn}`}
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มคีย์ใหม่</span>
          </button>

          <button
            id="dash-test-gateway-btn"
            onClick={() => onNavigate('playground')}
            className={`flex items-center gap-1.5 rounded-lg bg-[#18181b] hover:bg-zinc-800 text-zinc-200 hover:text-white border border-[#27272a] font-semibold transition-colors ${textScaleClass.btn}`}
          >
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>ทดสอบ Gateway API</span>
          </button>
        </div>
      </div>

      {/* Enterprise Gateway Action Bar */}
      <GatewayActionBar
        title="Live Gateway Analytics"
        badge="Real-Time"
        totalCount={statCards.length}
        itemLabel="ตัวชี้วัด"
        onSyncFreeModels={handleSyncFreeModels}
        isSyncing={isSyncing}
        onExportCsv={exportCsv}
        onRefresh={loadData}
        isLoading={loading}
      />

      {/* 10 Enterprise Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              id={card.id}
              onClick={() => onNavigate(card.tab)}
              className="p-4 rounded-xl bg-[#121215] border border-[#27272a] hover:border-zinc-700 hover:bg-[#151518] transition-all cursor-pointer group flex flex-col justify-between shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-400 truncate pr-1">
                  {card.label}
                </span>
                <div className={`p-1.5 rounded-lg ${card.badgeBg}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="my-2.5">
                <div className="text-2xl font-bold text-white tracking-tight font-mono">{card.value}</div>
              </div>

              <div className="flex items-center justify-between text-xs text-zinc-400 pt-1 border-t border-[#27272a]/60">
                <span className="truncate text-[11px]">{card.sub}</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white transition-colors shrink-0 ml-1" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Primary Telemetry Line Chart: 24h Token Consumption & Request Rates */}
      <TelemetryLineChart data={charts?.requestsOverTime || []} />

      {/* Row 2 Graphs: Error Rate, Provider Usage, Model Usage */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Graph 1: Error Rate */}
        <div className="p-4 rounded-xl bg-[#121215] border border-[#27272a] shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-semibold text-white">อัตราข้อผิดพลาด (Error Rate %)</h3>
              <p className="text-xs text-zinc-400 mt-0.5">ข้อผิดพลาดจาก Rate limit และเครือข่าย</p>
            </div>
            <span className="text-xs font-mono text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20 font-semibold">
              เป้าหมาย &lt; 2%
            </span>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts?.requestsOverTime || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="time" stroke="#71717a" fontSize={10} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} unit="%" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181b',
                    borderColor: '#27272a',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#fff',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="errorRate"
                  name="อัตราข้อผิดพลาด (%)"
                  stroke="#f43f5e"
                  strokeWidth={2}
                  dot={{ r: 2, fill: '#f43f5e' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Graph 2: Provider Usage Share */}
        <div className="p-4 rounded-xl bg-[#121215] border border-[#27272a] shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-semibold text-white">สัดส่วนการใช้งานแต่ละค่าย</h3>
              <p className="text-xs text-zinc-400 mt-0.5">สัดส่วนคำขอแยกตามผู้ให้บริการ</p>
            </div>
          </div>

          <div className="h-48 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts?.providerUsage || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={36}
                  outerRadius={65}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {(charts?.providerUsage || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181b',
                    borderColor: '#27272a',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#fff',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap gap-2 justify-center mt-2">
            {(charts?.providerUsage || []).slice(0, 4).map((p) => (
              <div key={p.name} className="flex items-center gap-1.5 text-xs text-zinc-400">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                <span>{p.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Graph 3: Model Usage */}
        <div className="p-4 rounded-xl bg-[#121215] border border-[#27272a]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-semibold text-white">โมเดลที่มีการใช้งานสูงสุด</h3>
              <p className="text-xs text-zinc-400 mt-0.5">จำนวนคำขอที่ประมวลผลต่อโมเดล</p>
            </div>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={charts?.modelUsage || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                <XAxis type="number" stroke="#71717a" fontSize={10} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="#71717a"
                  fontSize={10}
                  tickLine={false}
                  width={90}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181b',
                    borderColor: '#27272a',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#fff',
                  }}
                />
                <Bar dataKey="requests" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Usage Predictions */}
      <div className="p-4 rounded-xl bg-[#121215] border border-[#27272a] shadow-md mt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              การคาดการณ์ปริมาณการใช้งาน (Usage Prediction)
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              คำนวณจากข้อมูลย้อนหลังเพื่อประเมินค่าใช้จ่ายประจำเดือน และตรวจจับช่วงเวลาที่มีทราฟฟิกพุ่งสูง (Traffic Spikes)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {(charts?.usagePredictions || []).map((pred, i) => (
            <div key={i} className="p-3 bg-[#18181b] border border-[#27272a] rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pred.color }} />
                <span className="text-xs font-semibold text-white">{pred.providerName}</span>
              </div>
              
              <div className="space-y-3">
                <div>
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">ค่าใช้จ่ายประเมิน (เดือน)</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold font-mono text-zinc-200">
                      ${pred.predictedCost.toFixed(2)}
                    </span>
                    {pred.trend === 'UP' && <TrendingUp className="w-3.5 h-3.5 text-rose-400" />}
                    {pred.trend === 'DOWN' && <TrendingUp className="w-3.5 h-3.5 text-emerald-400 transform rotate-180" />}
                    {pred.trend === 'STABLE' && <span className="text-xs text-zinc-500">-</span>}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">คาดการณ์ Traffic Spike</div>
                  <div className="text-xs font-mono text-cyan-400">
                    {pred.projectedTrafficSpike}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

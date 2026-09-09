import React, { useEffect, useState } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Zap,
  Clock,
  Gauge,
  Radio,
} from 'lucide-react';
import { HealthCheckItem } from '../../types';
import { api } from '../../lib/api';
import { useDisplay } from '../../context/DisplayContext';
import { GatewayActionBar } from '../common/GatewayActionBar';

export const HealthView: React.FC = () => {
  const { textScaleClass } = useDisplay();
  const [healthList, setHealthList] = useState<HealthCheckItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingAll, setCheckingAll] = useState(false);

  const loadHealth = async () => {
    try {
      setLoading(true);
      const data = await api.getHealthStatus();
      setHealthList(data);
    } catch (err) {
      console.error('Failed to load health status', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHealth();
  }, []);

  const handleCheckAll = async () => {
    try {
      setCheckingAll(true);
      const res = await api.checkAllHealth();
      setHealthList(res.health);
    } catch (err) {
      console.error('Failed to trigger health check', err);
    } finally {
      setCheckingAll(false);
    }
  };

  const exportCsv = () => {
    const headers = ['Provider', 'Status', 'Latency (ms)', 'Success Rate (%)', 'Active Keys', 'Total Keys', 'Last Checked'];
    const rows = healthList.map((h) => [
      `"${h.providerName}"`,
      h.status,
      h.latencyMs,
      h.successRate,
      h.activeKeys,
      h.totalKeys,
      `"${h.lastChecked}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `provider_health_matrix_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const onlineCount = healthList.filter((h) => h.status === 'ONLINE').length;
  const degradedCount = healthList.filter((h) => h.status === 'DEGRADED').length;
  const offlineCount = healthList.filter((h) => h.status === 'OFFLINE').length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#27272a]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className={`${textScaleClass.heading} text-white tracking-tight`}>
              สถานะสุขภาพของผู้ให้บริการ (Provider Health Matrix)
            </h1>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
              {onlineCount}/{healthList.length} พร้อมทำงาน
            </span>
          </div>
          <p className={`${textScaleClass.subheading} mt-0.5`}>
            ระบบตรวจสอบ Uptime จำลอง, ความพร้อมใช้งานของ API, เกณฑ์มาตรฐาน Latency และการเชื่อมต่อไปยังผู้ให้บริการ
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="health-run-all-btn"
            onClick={handleCheckAll}
            disabled={checkingAll}
            className={`flex items-center gap-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-semibold transition-colors disabled:opacity-50 shadow-sm ${textScaleClass.btn}`}
          >
            <Zap className={`w-3.5 h-3.5 fill-black ${checkingAll ? 'animate-spin' : ''}`} />
            <span>{checkingAll ? 'กำลัง Ping ผู้ให้บริการ...' : 'ทดสอบสุขภาพทุกระบบทันที'}</span>
          </button>

          <button
            onClick={loadHealth}
            className="p-2 rounded-lg bg-[#121215] hover:bg-zinc-800 text-zinc-300 hover:text-white border border-[#27272a] transition-colors"
            title="รีเฟรชข้อมูลสุขภาพ"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Enterprise Gateway Action Bar */}
      <GatewayActionBar
        title="Health & SLA Matrix"
        badge="Uptime Monitor"
        totalCount={healthList.length}
        itemLabel="ปลายทาง"
        onExportCsv={exportCsv}
        onRefresh={loadHealth}
        isLoading={loading}
      />

      {/* Overview Status Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 rounded-xl bg-[#121215] border border-emerald-500/20 flex items-center justify-between shadow-xs">
          <div>
            <div className="text-xs text-zinc-400">ผู้ให้บริการที่พร้อมใช้งาน (Online)</div>
            <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">{onlineCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#121215] border border-amber-500/20 flex items-center justify-between shadow-xs">
          <div>
            <div className="text-xs text-zinc-400">ประสิทธิภาพลดลง / ติด Rate Limit</div>
            <div className="text-2xl font-bold text-amber-400 font-mono mt-1">{degradedCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#121215] border border-rose-500/20 flex items-center justify-between shadow-xs">
          <div>
            <div className="text-xs text-zinc-400">ออฟไลน์ / ข้อผิดพลาด</div>
            <div className="text-2xl font-bold text-rose-400 font-mono mt-1">{offlineCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <XCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Provider Health Matrix Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {healthList.map((h) => {
          const isOnline = h.status === 'ONLINE';
          const isDegraded = h.status === 'DEGRADED';

          return (
            <div
              key={h.providerId}
              className="p-4 rounded-xl bg-[#121215] border border-[#27272a] hover:border-zinc-700 transition-all flex flex-col justify-between space-y-3.5 shadow-xs"
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <h3 className="text-sm font-semibold text-white tracking-tight">{h.providerName}</h3>
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                      isOnline
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : isDegraded
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isOnline ? 'bg-emerald-400 animate-pulse' : isDegraded ? 'bg-amber-400' : 'bg-rose-400'
                      }`}
                    />
                    {isOnline ? 'พร้อมใช้งาน' : isDegraded ? 'ประสิทธิภาพลด' : 'ออฟไลน์'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#18181b] border border-[#27272a] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">ความหน่วง (Latency):</span>
                    <strong
                      className={`font-mono font-bold ${
                        h.latencyMs < 300
                          ? 'text-emerald-400'
                          : h.latencyMs < 800
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {h.latencyMs}ms
                    </strong>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">อัตราสำเร็จ (SLA):</span>
                    <strong className="text-white font-mono font-bold">{h.successRate}%</strong>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">คีย์ในคลัสเตอร์:</span>
                    <span className="font-mono text-xs">
                      <span className="text-emerald-400 font-bold">{h.activeKeys} พร้อม</span> /{' '}
                      <span className="text-zinc-400">{h.totalKeys} ทั้งหมด</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2.5 border-t border-[#27272a]/60 flex items-center justify-between text-xs text-zinc-400">
                <span className="flex items-center gap-1 text-[11px]">
                  <Clock className="w-3 h-3 text-zinc-500" />
                  <span>ตรวจเมื่อ {new Date(h.lastChecked).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                </span>
                <span className="font-mono text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  PING OK
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

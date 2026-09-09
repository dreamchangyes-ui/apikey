import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  RefreshCw,
  Trash2,
  CheckCircle2,
  Clock,
  RotateCw,
  ShieldAlert,
  Flame,
  XCircle,
} from 'lucide-react';
import { ErrorLogItem, UserRole } from '../../types';
import { api } from '../../lib/api';
import { useDisplay } from '../../context/DisplayContext';
import { GatewayActionBar } from '../common/GatewayActionBar';

interface ErrorsViewProps {
  userRole: UserRole;
}

export const ErrorsView: React.FC<ErrorsViewProps> = ({ userRole }) => {
  const { textScaleClass } = useDisplay();
  const [errors, setErrors] = useState<ErrorLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadErrors = async () => {
    try {
      setLoading(true);
      const data = await api.getErrors();
      setErrors(data);
    } catch (err) {
      console.error('Failed to load error events', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadErrors();
  }, []);

  const handleResolve = async (id: string) => {
    try {
      await api.resolveError(id);
      setErrors((prev) => prev.map((e) => (e.id === id ? { ...e, resolved: true } : e)));
    } catch (err) {
      console.error('Failed to resolve error', err);
    }
  };

  const handleClearAll = async () => {
    if (userRole !== 'ADMIN') return;
    if (!confirm('คุณต้องการล้างบันทึกข้อผิดพลาดที่แก้ไขแล้วทั้งหมดหรือไม่?')) return;
    try {
      await api.clearErrors();
      loadErrors();
    } catch (err) {
      console.error('Failed to clear errors', err);
    }
  };

  const exportCsv = () => {
    const headers = ['Time', 'Type', 'Provider', 'Key Label', 'Error Message', 'Count', 'Resolved'];
    const rows = errors.map((err) => [
      `"${err.createdAt}"`,
      err.type,
      `"${err.provider}"`,
      `"${err.keyLabel}"`,
      `"${err.message.replace(/"/g, '""')}"`,
      err.count,
      err.resolved ? 'Yes' : 'No',
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `gateway_errors_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Group counts by type
  const rateLimitCount = errors.filter((e) => e.type === 'RATE_LIMIT').length;
  const invalidKeyCount = errors.filter((e) => e.type === 'INVALID_KEY').length;
  const providerOfflineCount = errors.filter((e) => e.type === 'PROVIDER_OFFLINE').length;
  const timeoutCount = errors.filter((e) => e.type === 'TIMEOUT').length;
  const quotaCount = errors.filter((e) => e.type === 'QUOTA_EXCEEDED').length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#27272a]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className={`${textScaleClass.heading} text-white tracking-tight`}>
              การเฝ้าระวังข้อผิดพลาดและการตอบสนองเหตุการณ์ (Error Monitoring)
            </h1>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-semibold">
              {errors.length} เหตุการณ์
            </span>
          </div>
          <p className={`${textScaleClass.subheading} mt-0.5`}>
            ติดตามสถานะ HTTP 429 แบบเรียลไทม์, ตรวจจับคีย์หมดอายุ, ปัญหาหมดเวลาเชื่อมต่อ และการสลับเส้นทางสำรองอัตโนมัติ
          </p>
        </div>

        <div className="flex items-center gap-2">
          {userRole === 'ADMIN' && (
            <button
              onClick={handleClearAll}
              className={`flex items-center gap-1.5 rounded-lg bg-[#18181b] hover:bg-zinc-800 text-zinc-300 hover:text-white border border-[#27272a] font-semibold transition-colors ${textScaleClass.btn}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>ล้างรายการที่แก้แล้ว</span>
            </button>
          )}

          <button
            onClick={loadErrors}
            className="p-2 rounded-lg bg-[#121215] hover:bg-zinc-800 text-zinc-300 hover:text-white border border-[#27272a] transition-colors"
            title="รีเฟรชบันทึกข้อผิดพลาด"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Enterprise Gateway Action Bar */}
      <GatewayActionBar
        title="Incident Logs & Failover Events"
        badge="Live Telemetry"
        totalCount={errors.length}
        itemLabel="เหตุการณ์"
        onExportCsv={exportCsv}
        onRefresh={loadErrors}
        isLoading={loading}
      />

      {/* Error Category Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-xl bg-[#121215] border border-amber-500/20 shadow-xs">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Rate Limit (429)</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-1.5 font-mono">{rateLimitCount}</div>
          <div className="text-[11px] text-zinc-400 mt-1">เข้าสู่โหมดพักคีย์อัตโนมัติ</div>
        </div>

        <div className="p-4 rounded-xl bg-[#121215] border border-rose-500/20 shadow-xs">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>คีย์ไม่ถูกต้อง (401)</span>
            <XCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-1.5 font-mono">{invalidKeyCount}</div>
          <div className="text-[11px] text-zinc-400 mt-1">กักกันและระงับจากพูล</div>
        </div>

        <div className="p-4 rounded-xl bg-[#121215] border border-rose-500/20 shadow-xs">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>ผู้ให้บริการออฟไลน์</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-white mt-1.5 font-mono">{providerOfflineCount}</div>
          <div className="text-[11px] text-zinc-400 mt-1">สลับไปยังผู้ให้บริการสำรอง</div>
        </div>

        <div className="p-4 rounded-xl bg-[#121215] border border-orange-500/20 shadow-xs">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>หมดเวลาเชื่อมต่อ (Timeout)</span>
            <Clock className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-1.5 font-mono">{timeoutCount}</div>
          <div className="text-[11px] text-zinc-400 mt-1">&gt; เกินเกณฑ์ 30,000ms</div>
        </div>

        <div className="p-4 rounded-xl bg-[#121215] border border-purple-500/20 shadow-xs">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>เกินโควต้า (Quota)</span>
            <ShieldAlert className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-1.5 font-mono">{quotaCount}</div>
          <div className="text-[11px] text-zinc-400 mt-1">บังคับใช้ขีดจำกัดรายวัน</div>
        </div>
      </div>

      {/* Enterprise Errors Table */}
      <div className="overflow-x-auto rounded-xl border border-[#27272a] bg-[#121215] shadow-lg">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className={`border-b border-[#27272a] bg-[#16161a] text-zinc-400 font-semibold uppercase tracking-wider ${textScaleClass.th}`}>
              <th>เวลา</th>
              <th>หมวดหมู่ข้อผิดพลาด</th>
              <th>ผู้ให้บริการ & คีย์</th>
              <th>ข้อความข้อผิดพลาด</th>
              <th>จำนวนครั้ง</th>
              <th>สถานะการแก้ไข</th>
              <th className="text-right">การจัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#27272a]/60">
            {errors.map((err) => (
              <tr key={err.id} className="hover:bg-[#18181c] transition-colors">
                <td className={`${textScaleClass.td} font-mono text-zinc-300 text-xs`}>
                  {new Date(err.createdAt).toLocaleTimeString('th-TH')}
                </td>

                <td className={textScaleClass.td}>
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${
                      err.type === 'RATE_LIMIT'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : err.type === 'INVALID_KEY'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                    }`}
                  >
                    {err.type === 'RATE_LIMIT'
                      ? 'RATE LIMIT'
                      : err.type === 'INVALID_KEY'
                      ? 'INVALID KEY'
                      : err.type === 'PROVIDER_OFFLINE'
                      ? 'OFFLINE'
                      : err.type === 'TIMEOUT'
                      ? 'TIMEOUT'
                      : err.type}
                  </span>
                </td>

                <td className={textScaleClass.td}>
                  <div className="font-semibold text-white">{err.provider}</div>
                  <div className="text-[11px] font-mono text-zinc-400">{err.keyLabel}</div>
                </td>

                <td className={`${textScaleClass.td} max-w-sm`}>
                  <div className="text-zinc-200 font-mono text-xs truncate" title={err.message}>
                    {err.message}
                  </div>
                </td>

                <td className={`${textScaleClass.td} font-mono text-white`}>
                  <span className="bg-[#18181b] border border-[#27272a] px-2 py-0.5 rounded text-xs">
                    {err.count} ครั้ง
                  </span>
                </td>

                <td className={textScaleClass.td}>
                  {err.resolved ? (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> แก้ไขแล้ว
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20 font-semibold">
                      <Clock className="w-3.5 h-3.5" /> กำลังเกิดปัญหา
                    </span>
                  )}
                </td>

                <td className={`${textScaleClass.td} text-right`}>
                  {!err.resolved && (
                    <button
                      onClick={() => handleResolve(err.id)}
                      className="px-3 py-1.5 rounded-lg bg-[#18181b] hover:bg-zinc-800 text-zinc-200 text-xs font-semibold border border-[#27272a] transition-colors"
                    >
                      ทำเครื่องหมายว่าแก้แล้ว
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

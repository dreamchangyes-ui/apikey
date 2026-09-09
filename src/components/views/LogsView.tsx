import React, { useEffect, useState, useMemo } from 'react';
import {
  FileText,
  Search,
  RefreshCw,
  Trash2,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  Zap,
  Download,
  X,
  ShieldCheck,
  Activity,
  Cpu,
  Layers,
  ArrowUpRight,
  ExternalLink,
  Copy,
  Check,
  Camera,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Sparkles,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Eye,
  Terminal,
} from 'lucide-react';
import { UsageLogItem, ProviderItem, ProviderModelItem, UserRole } from '../../types';
import { api } from '../../lib/api';
import { ExportLogsModal } from '../ExportLogsModal';
import { LogDetailModal } from '../LogDetailModal';
import { useDisplay } from '../../context/DisplayContext';
import { TableFilterBar } from '../common/TableFilterBar';
import { DateRangeFilterValue } from '../common/DateRangeDropdown';
import { MultiSelectOption } from '../common/MultiSelectDropdown';

interface LogsViewProps {
  userRole: UserRole;
}

type SortField = 'timestamp' | 'status' | 'provider' | 'model' | 'latency' | 'tokens';
type SortOrder = 'asc' | 'desc';

export const LogsView: React.FC<LogsViewProps> = ({ userRole }) => {
  const { textScaleClass } = useDisplay();
  const [logs, setLogs] = useState<UsageLogItem[]>([]);
  const [providers, setProviders] = useState<ProviderItem[]>([]);
  const [models, setModels] = useState<ProviderModelItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Multi-Select Filters
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [dateRange, setDateRange] = useState<DateRangeFilterValue>({ preset: 'all' });
  const [search, setSearch] = useState('');

  // Sorting
  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Pagination & Page Size
  const [pageSize, setPageSize] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Screenshot / Snapshot Ready Mode
  const [isSnapshotMode, setIsSnapshotMode] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Export Modal & Feedback
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportFeedback, setExportFeedback] = useState<{ filename: string; count: number } | null>(null);

  // Selected Log for details
  const [selectedLog, setSelectedLog] = useState<UsageLogItem | null>(null);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const [logsData, provsData, modelsData] = await Promise.all([
        api.getLogs(),
        api.getProviders(),
        api.getModels(),
      ]);
      setLogs(logsData);
      setProviders(provsData);
      setModels(modelsData);
    } catch (err) {
      console.error('Failed to load logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const handleClear = async () => {
    if (userRole !== 'ADMIN') return;
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการล้างบันทึกการใช้งานทั้งหมด?')) return;
    try {
      await api.clearLogs();
      setLogs([]);
    } catch (err) {
      console.error('Failed to clear logs', err);
    }
  };

  const handleExportSuccess = (filename: string, count: number) => {
    setExportFeedback({ filename, count });
    setTimeout(() => {
      setExportFeedback(null);
    }, 6000);
  };

  const resetFilters = () => {
    setSelectedProviders([]);
    setSelectedStatuses([]);
    setSelectedModel('');
    setDateRange({ preset: 'all' });
    setSearch('');
    setCurrentPage(1);
  };

  // Provider Options for MultiSelect
  const providerOptions: MultiSelectOption[] = useMemo(() => {
    return providers.map((p) => {
      const count = logs.filter(
        (l) =>
          (l.provider || l.providerName || '').toLowerCase() === p.name.toLowerCase() ||
          l.providerId === p.id
      ).length;
      return {
        value: p.name,
        label: p.name,
        count,
      };
    });
  }, [providers, logs]);

  // Status Options for MultiSelect
  const statusOptions: MultiSelectOption[] = useMemo(() => {
    const s200 = logs.filter((l) => (l.status || l.responseStatus || 200) === 200).length;
    const s429 = logs.filter((l) => (l.status || l.responseStatus) === 429).length;
    const s500 = logs.filter((l) => (l.status || l.responseStatus || 0) >= 500).length;
    return [
      { value: '200', label: '200 OK (สำเร็จ)', count: s200 },
      { value: '429', label: '429 Rate Limit (หมุนเวียน)', count: s429 },
      { value: '500', label: '500+ Error (ข้อผิดพลาด)', count: s500 },
    ];
  }, [logs]);

  // Copy Single Request ID
  const handleCopyId = (e: React.MouseEvent, reqId: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(reqId);
    setCopiedId(reqId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // 1. Search Query
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchId = (log.requestId || '').toLowerCase().includes(q);
        const matchProv = (log.provider || log.providerName || '').toLowerCase().includes(q);
        const matchModel = (log.model || log.modelId || '').toLowerCase().includes(q);
        const matchKey = (log.keyLabel || log.maskedKey || '').toLowerCase().includes(q);
        const matchClient = (log.clientName || '').toLowerCase().includes(q);
        const matchPreview = (log.requestPreview || '').toLowerCase().includes(q);
        if (!matchId && !matchProv && !matchModel && !matchKey && !matchClient && !matchPreview) {
          return false;
        }
      }

      // 2. Multi-Select Providers
      if (selectedProviders.length > 0) {
        const provName = (log.provider || log.providerName || '').toLowerCase();
        const provId = (log.providerId || '').toLowerCase();
        const hasMatch = selectedProviders.some(
          (sp) => sp.toLowerCase() === provName || sp.toLowerCase() === provId
        );
        if (!hasMatch) return false;
      }

      // 3. Multi-Select Statuses
      if (selectedStatuses.length > 0) {
        const statusVal = String(log.status || log.responseStatus || 200);
        const is500Plus = (log.status || log.responseStatus || 0) >= 500;
        const hasMatch = selectedStatuses.some((st) => {
          if (st === '500' && is500Plus) return true;
          return st === statusVal;
        });
        if (!hasMatch) return false;
      }

      // 4. Model Filter
      if (selectedModel) {
        const m = (log.model || log.modelId || '').toLowerCase();
        if (m !== selectedModel.toLowerCase()) return false;
      }

      // 5. Date Range Filter
      const logTime = new Date(log.createdAt || log.timestamp || Date.now()).getTime();
      const now = Date.now();

      if (dateRange.preset === 'today') {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        if (logTime < startOfToday.getTime()) return false;
      } else if (dateRange.preset === '24h') {
        if (logTime < now - 24 * 3600 * 1000) return false;
      } else if (dateRange.preset === '7d') {
        if (logTime < now - 7 * 86400 * 1000) return false;
      } else if (dateRange.preset === '30d') {
        if (logTime < now - 30 * 86400 * 1000) return false;
      } else if (dateRange.preset === 'custom') {
        if (dateRange.startDate) {
          const start = new Date(dateRange.startDate).setHours(0, 0, 0, 0);
          if (logTime < start) return false;
        }
        if (dateRange.endDate) {
          const end = new Date(dateRange.endDate).setHours(23, 59, 59, 999);
          if (logTime > end) return false;
        }
      }

      return true;
    });
  }, [logs, search, selectedProviders, selectedStatuses, selectedModel, dateRange]);

  // Processed and Sorted Logs
  const sortedLogs = useMemo(() => {
    const list = [...filteredLogs];
    list.sort((a, b) => {
      let valA: any = 0;
      let valB: any = 0;

      switch (sortField) {
        case 'timestamp':
          valA = new Date(a.createdAt || a.timestamp || 0).getTime();
          valB = new Date(b.createdAt || b.timestamp || 0).getTime();
          break;
        case 'status':
          valA = a.status || a.responseStatus || 200;
          valB = b.status || b.responseStatus || 200;
          break;
        case 'provider':
          valA = (a.provider || a.providerName || '').toLowerCase();
          valB = (b.provider || b.providerName || '').toLowerCase();
          break;
        case 'model':
          valA = (a.model || a.modelId || '').toLowerCase();
          valB = (b.model || b.modelId || '').toLowerCase();
          break;
        case 'latency':
          valA = a.latencyMs || 0;
          valB = b.latencyMs || 0;
          break;
        case 'tokens':
          valA = a.totalTokens || (a.promptTokens || 0) + (a.completionTokens || 0);
          valB = b.totalTokens || (b.promptTokens || 0) + (b.completionTokens || 0);
          break;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [filteredLogs, sortField, sortOrder]);

  // Copy Table Summary as Markdown / TSV for Slack or Notion
  const handleCopyTableSummary = () => {
    const header = ['Timestamp', 'Status', 'Provider', 'Model', 'Key', 'Prompt Tok', 'Compl Tok', 'Total Tok', 'Latency (ms)'];
    const rows = sortedLogs.slice(0, 50).map((l) => [
      new Date(l.createdAt || l.timestamp || Date.now()).toLocaleTimeString('th-TH'),
      String(l.status || l.responseStatus || 200),
      l.provider || l.providerName || '-',
      l.model || l.modelId || '-',
      l.keyLabel || 'Default',
      String(l.promptTokens || l.inputTokens || 0),
      String(l.completionTokens || l.outputTokens || 0),
      String(l.totalTokens || 0),
      String(l.latencyMs || 0),
    ]);

    const mdTable = `| ${header.join(' | ')} |\n| ${header.map(() => '---').join(' | ')} |\n` +
      rows.map((r) => `| ${r.join(' | ')} |`).join('\n');

    navigator.clipboard.writeText(mdTable);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 3000);
  };

  // Sort Handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Paginated Logs
  const totalPages = Math.max(1, Math.ceil(sortedLogs.length / pageSize));
  const paginatedLogs = useMemo(() => {
    if (pageSize === -1) return sortedLogs;
    const start = (currentPage - 1) * pageSize;
    return sortedLogs.slice(start, start + pageSize);
  }, [sortedLogs, currentPage, pageSize]);

  // Metrics on filtered logs
  const totalCount = logs.length;
  const filteredCount = sortedLogs.length;
  const successCount = sortedLogs.filter((l) => (l.status || l.responseStatus) === 200).length;
  const rateLimitCount = sortedLogs.filter((l) => (l.status || l.responseStatus) === 429).length;
  const totalTokensSum = sortedLogs.reduce(
    (acc, l) => acc + (l.totalTokens || (l.promptTokens || 0) + (l.completionTokens || 0)),
    0
  );
  const avgLatency =
    filteredCount > 0
      ? Math.round(sortedLogs.reduce((acc, l) => acc + (l.latencyMs || 0), 0) / filteredCount)
      : 0;
  const successPercent = filteredCount > 0 ? ((successCount / filteredCount) * 100).toFixed(1) : '100.0';

  // Provider visual style helper
  const getProviderBadgeStyle = (name: string = '') => {
    const lower = name.toLowerCase();
    if (lower.includes('openai')) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    if (lower.includes('gemini') || lower.includes('google')) return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    if (lower.includes('anthropic') || lower.includes('claude')) return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    if (lower.includes('deepseek')) return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
    if (lower.includes('groq')) return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
    if (lower.includes('mistral')) return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    return 'bg-zinc-800/80 text-zinc-300 border-zinc-700/60';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className={`${textScaleClass.heading} text-white tracking-tight`}>
              บันทึกการใช้งาน & เทเลเมทรี (Telemetry Logs)
            </h1>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Telemetry Stream
            </span>
          </div>
          <p className={`${textScaleClass.subheading} mt-0.5`}>
            ประวัติการประมวลผลคำขอ completions, เวลาแฝง (Latency), การบริโภคโทเค็น และการตรวจสอบความปลอดภัย
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsSnapshotMode(!isSnapshotMode)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold border transition-all ${
              isSnapshotMode
                ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-900/30'
                : 'bg-[#18181b] hover:bg-zinc-800 text-zinc-300 hover:text-white border-zinc-700'
            }`}
            title="เปิด/ปิดโหมดพร้อมแคปเจอร์ภาพหน้าจอ (Screenshot Clean View)"
          >
            <Camera className="w-3.5 h-3.5 text-purple-400" />
            <span>{isSnapshotMode ? 'ออกจาก Snapshot Mode' : 'โหมดแคปเจอร์ตาราง'}</span>
          </button>

          <button
            onClick={handleCopyTableSummary}
            className="flex items-center gap-1.5 rounded-lg bg-[#18181b] hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 px-3 py-1.5 text-xs font-semibold transition-all"
            title="คัดลอกตารางสรุปเป็น Markdown สำหรับวางใน Discord/Notion/Slack"
          >
            {copiedSummary ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">คัดลอกตารางแล้ว!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-zinc-400" />
                <span>Copy ตาราง</span>
              </>
            )}
          </button>

          <button
            onClick={() => setExportModalOpen(true)}
            className={`flex items-center gap-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-semibold shadow-sm transition-all ${textScaleClass.btn}`}
            title="ส่งออกบันทึกการใช้งานเป็นไฟล์ CSV หรือ JSON"
          >
            <Download className="w-3.5 h-3.5 fill-black" />
            <span>ส่งออก (Export)</span>
          </button>

          {userRole === 'ADMIN' && (
            <button
              onClick={handleClear}
              className={`flex items-center gap-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-rose-400 font-medium border border-zinc-700 transition-colors ${textScaleClass.btn}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>ล้างบันทึก</span>
            </button>
          )}

          <button
            onClick={loadLogs}
            className="p-2 rounded-lg bg-[#121215] hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-colors"
            title="รีเฟรชบันทึก"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Export Success Notification Banner */}
      {exportFeedback && (
        <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-800/80 text-emerald-200 text-xs flex items-center justify-between shadow-lg animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <span className="font-semibold text-white">ส่งออกไฟล์ CSV สำเร็จเรียบร้อย!</span>{' '}
              <span>
                สร้างรายงานการตรวจสอบจำนวน <strong className="text-white">{exportFeedback.count}</strong> รายการ บันทึกเป็น{' '}
                <code className="bg-black/40 px-1.5 py-0.5 rounded font-mono text-emerald-300">
                  {exportFeedback.filename}
                </code>
              </span>
            </div>
          </div>
          <button
            onClick={() => setExportFeedback(null)}
            className="p-1 rounded text-emerald-400 hover:text-white hover:bg-emerald-900/40 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Snapshot Header Watermark Banner (when in Snapshot Mode) */}
      {isSnapshotMode && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-zinc-900 via-[#141419] to-zinc-900 border border-purple-500/40 shadow-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                FreeLLM Enterprise Gateway • Live Telemetry Audit
                <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">
                  SLA {successPercent}%
                </span>
              </div>
              <div className="text-xs font-mono text-zinc-400 mt-0.5 flex items-center gap-3">
                <span>บันทึก {totalCount.toLocaleString()} คำขอ</span>
                <span>•</span>
                <span>เวลาตอบสนองเฉลี่ย {avgLatency}ms</span>
                <span>•</span>
                <span>โทเค็นสะสม {totalTokensSum.toLocaleString()}</span>
                <span>•</span>
                <span>สแนปช็อต: {new Date().toLocaleString('th-TH')}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-mono text-zinc-500 bg-black/40 px-2 py-1 rounded border border-zinc-800">
              CONFIDENTIAL • INTERNAL AUDIT
            </span>
          </div>
        </div>
      )}

      {/* KPI Telemetry Stat Summary */}
      {!isSnapshotMode && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-3.5 rounded-xl bg-[#121215] border border-zinc-800 shadow-sm hover:border-zinc-700 transition-colors">
            <div className="text-[11px] font-mono font-medium text-zinc-400 uppercase tracking-wider">
              คำขอทั้งหมด (Requests)
            </div>
            <div className="text-xl font-bold text-white font-mono mt-1 tabular-nums">
              {totalCount.toLocaleString()}
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5">ในมุมมองปัจจุบัน</div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#121215] border border-zinc-800 shadow-sm hover:border-zinc-700 transition-colors">
            <div className="text-[11px] font-mono font-medium text-zinc-400 uppercase tracking-wider">
              อัตราสำเร็จ (SLA 200)
            </div>
            <div className="text-xl font-bold text-emerald-400 font-mono mt-1 tabular-nums">
              {successPercent}%
            </div>
            <div className="text-[10px] text-emerald-500/80 mt-0.5">{successCount} คำขอสำเร็จ</div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#121215] border border-zinc-800 shadow-sm hover:border-zinc-700 transition-colors">
            <div className="text-[11px] font-mono font-medium text-zinc-400 uppercase tracking-wider">
              Rate Limit (429)
            </div>
            <div className="text-xl font-bold text-amber-400 font-mono mt-1 tabular-nums">
              {rateLimitCount}
            </div>
            <div className="text-[10px] text-amber-500/80 mt-0.5">หมุนเวียนคีย์อัตโนมัติ</div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#121215] border border-zinc-800 shadow-sm hover:border-zinc-700 transition-colors">
            <div className="text-[11px] font-mono font-medium text-zinc-400 uppercase tracking-wider">
              โทเค็นรวม (Total Tokens)
            </div>
            <div className="text-xl font-bold text-white font-mono mt-1 tabular-nums">
              {totalTokensSum.toLocaleString()}
            </div>
            <div className="text-[10px] text-cyan-400 mt-0.5">In + Out Tokens</div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#121215] border border-zinc-800 shadow-sm hover:border-zinc-700 transition-colors">
            <div className="text-[11px] font-mono font-medium text-zinc-400 uppercase tracking-wider">
              เวลาตอบสนองเฉลี่ย
            </div>
            <div className="text-xl font-bold text-emerald-400 font-mono mt-1 tabular-nums">
              {avgLatency} ms
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5">End-to-End Latency</div>
          </div>
        </div>
      )}

      {/* Search & Multi-Select Filter Bar */}
      {!isSnapshotMode && (
        <TableFilterBar
          search={search}
          onSearchChange={(val) => {
            setSearch(val);
            setCurrentPage(1);
          }}
          searchPlaceholder="ค้นหา Request ID, Key Label, Client หรือข้อความ..."
          providers={providerOptions}
          selectedProviders={selectedProviders}
          onProvidersChange={(selected) => {
            setSelectedProviders(selected);
            setCurrentPage(1);
          }}
          providerTitle="ผู้ให้บริการ"
          statuses={statusOptions}
          selectedStatuses={selectedStatuses}
          onStatusesChange={(selected) => {
            setSelectedStatuses(selected);
            setCurrentPage(1);
          }}
          statusTitle="สถานะ HTTP"
          dateRange={dateRange}
          onDateRangeChange={(range) => {
            setDateRange(range);
            setCurrentPage(1);
          }}
          extraDropdown={
            models.length > 0 ? (
              <select
                value={selectedModel}
                onChange={(e) => {
                  setSelectedModel(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-[#141418] border border-zinc-800 hover:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-zinc-500"
              >
                <option value="">ทุกโมเดล AI ({models.length})</option>
                {models.map((m) => (
                  <option key={m.id} value={m.modelId}>
                    {m.name}
                  </option>
                ))}
              </select>
            ) : undefined
          }
          onReset={resetFilters}
          totalFilteredCount={filteredCount}
          totalCount={totalCount}
        />
      )}

      {/* Professional Enterprise Data Grid Table Frame */}
      <div className="rounded-xl border border-zinc-800 bg-[#0e0e12] shadow-2xl overflow-hidden">
        {/* Table Top Toolbar Header */}
        <div className="px-4 py-2.5 bg-[#141418] border-b border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-white font-mono flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              REQUEST LOGS AUDIT
            </span>
            <span className="text-zinc-500 font-mono text-[11px]">
              แสดง {paginatedLogs.length} จาก {sortedLogs.length} รายการ
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Page Size selector */}
            <div className="flex items-center gap-1.5 text-zinc-400 text-[11px] font-mono">
              <span>แถวต่อหน้า:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-[#18181b] border border-zinc-700 rounded px-1.5 py-0.5 text-zinc-200 text-xs focus:outline-none"
              >
                <option value="15">15</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
                <option value="-1">ทั้งหมด</option>
              </select>
            </div>
          </div>
        </div>

        {/* The Core Enterprise Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="border-b border-zinc-800 bg-[#16161c] text-zinc-400 font-mono text-[11px] uppercase tracking-wider select-none">
                {/* Timestamp & ID */}
                <th
                  onClick={() => handleSort('timestamp')}
                  className="py-3 px-4 font-semibold hover:text-white cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>เวลา & REQUEST ID</span>
                    {sortField === 'timestamp' ? (
                      sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-400" /> : <ArrowDown className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 opacity-40" />
                    )}
                  </div>
                </th>

                {/* HTTP Status */}
                <th
                  onClick={() => handleSort('status')}
                  className="py-3 px-3 font-semibold hover:text-white cursor-pointer transition-colors text-center"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>สถานะ</span>
                    {sortField === 'status' && (
                      sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-400" /> : <ArrowDown className="w-3 h-3 text-emerald-400" />
                    )}
                  </div>
                </th>

                {/* Provider */}
                <th
                  onClick={() => handleSort('provider')}
                  className="py-3 px-3 font-semibold hover:text-white cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>ผู้ให้บริการ</span>
                    {sortField === 'provider' && (
                      sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-400" /> : <ArrowDown className="w-3 h-3 text-emerald-400" />
                    )}
                  </div>
                </th>

                {/* Model */}
                <th
                  onClick={() => handleSort('model')}
                  className="py-3 px-3 font-semibold hover:text-white cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>โมเดล AI</span>
                    {sortField === 'model' && (
                      sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-400" /> : <ArrowDown className="w-3 h-3 text-emerald-400" />
                    )}
                  </div>
                </th>

                {/* Key Label */}
                <th className="py-3 px-3 font-semibold">คีย์ที่ประมวลผล</th>

                {/* Tokens In/Out */}
                <th
                  onClick={() => handleSort('tokens')}
                  className="py-3 px-3 font-semibold hover:text-white cursor-pointer transition-colors text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>โทเค็น (IN / OUT / TOTAL)</span>
                    {sortField === 'tokens' && (
                      sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-400" /> : <ArrowDown className="w-3 h-3 text-emerald-400" />
                    )}
                  </div>
                </th>

                {/* Latency */}
                <th
                  onClick={() => handleSort('latency')}
                  className="py-3 px-3 font-semibold hover:text-white cursor-pointer transition-colors text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>เวลาแฝง (LATENCY)</span>
                    {sortField === 'latency' && (
                      sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-400" /> : <ArrowDown className="w-3 h-3 text-emerald-400" />
                    )}
                  </div>
                </th>

                {/* Client Name */}
                <th className="py-3 px-3 font-semibold">ผู้เรียก (CLIENT)</th>

                {/* Inspect Action */}
                <th className="py-3 px-4 font-semibold text-right">การตรวจสอบ</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-800/50 text-xs">
              {paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-14 text-center text-zinc-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FileText className="w-9 h-9 text-zinc-600 stroke-1" />
                      <p className="text-sm font-semibold text-zinc-300">ไม่พบบันทึกการใช้งานที่ตรงกับเงื่อนไข</p>
                      <p className="text-xs text-zinc-500">ลองปรับเปลี่ยนคำค้นหา หรือล้างตัวกรอง</p>
                      <button
                        onClick={resetFilters}
                        className="mt-2 px-3.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-white transition-colors"
                      >
                        ล้างตัวกรองทั้งหมด
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log, idx) => {
                  const statusVal = log.status || log.responseStatus || 200;
                  const is200 = statusVal === 200;
                  const is429 = statusVal === 429;
                  const logDate = new Date(log.createdAt || log.timestamp || Date.now());
                  const timeStr = logDate.toLocaleTimeString('th-TH');
                  const inTok = log.promptTokens ?? log.inputTokens ?? 0;
                  const outTok = log.completionTokens ?? log.outputTokens ?? 0;
                  const totalTok = log.totalTokens ?? inTok + outTok;
                  const isCopied = copiedId === log.requestId;

                  return (
                    <tr
                      key={log.id || idx}
                      onClick={() => setSelectedLog(log)}
                      className="transition-colors cursor-pointer hover:bg-zinc-800/40 group relative"
                    >
                      {/* Left border accent line on hover */}
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="font-mono text-zinc-200 text-xs font-medium">{timeStr}</div>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="font-mono text-[11px] text-zinc-400 max-w-[120px] truncate">
                                {log.requestId}
                              </span>
                              <button
                                onClick={(e) => handleCopyId(e, log.requestId)}
                                className="p-0.5 rounded text-zinc-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                                title="คัดลอก Request ID"
                              >
                                {isCopied ? (
                                  <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md font-mono font-bold text-[11px] border ${
                            is200
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : is429
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              is200 ? 'bg-emerald-400' : is429 ? 'bg-amber-400' : 'bg-rose-400'
                            }`}
                          />
                          <span>{statusVal} {is200 ? 'OK' : is429 ? 'LIMIT' : 'ERR'}</span>
                        </span>
                      </td>

                      {/* Provider */}
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${getProviderBadgeStyle(
                            log.provider || log.providerName
                          )}`}
                        >
                          {log.provider || log.providerName || 'Gateway'}
                        </span>
                      </td>

                      {/* Model */}
                      <td className="py-2.5 px-3">
                        <span className="font-mono text-xs text-zinc-300 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 truncate max-w-[150px] inline-block">
                          {log.model || log.modelId || '-'}
                        </span>
                      </td>

                      {/* Key Label */}
                      <td className="py-2.5 px-3">
                        <div className="font-mono text-zinc-300 text-xs truncate max-w-[130px]">
                          {log.keyLabel || 'Key Pool'}
                        </div>
                        {log.maskedKey && (
                          <div className="text-[10px] font-mono text-zinc-400 truncate">{log.maskedKey}</div>
                        )}
                      </td>

                      {/* Tokens */}
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                        <div className="flex items-center justify-end gap-1.5">
                          <span className="text-zinc-400 text-[11px]">
                            {inTok.toLocaleString()}
                          </span>
                          <span className="text-zinc-600">/</span>
                          <span className="text-cyan-400 text-[11px]">
                            {outTok.toLocaleString()}
                          </span>
                          <span className="text-zinc-600">=</span>
                          <span className="font-bold text-white text-xs bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                            {totalTok.toLocaleString()}
                          </span>
                        </div>
                      </td>

                      {/* Latency */}
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${
                            log.latencyMs < 200
                              ? 'text-emerald-400 bg-emerald-950/40 border border-emerald-800/30'
                              : log.latencyMs < 700
                              ? 'text-zinc-300 bg-zinc-800/60 border border-zinc-700/30'
                              : 'text-amber-400 bg-amber-950/40 border border-amber-800/30'
                          }`}
                        >
                          <Zap className="w-2.5 h-2.5" />
                          <span>{log.latencyMs} ms</span>
                        </span>
                      </td>

                      {/* Client */}
                      <td className="py-2.5 px-3">
                        <span className="text-zinc-400 font-mono text-xs">
                          {log.clientName || 'Main Gateway'}
                        </span>
                      </td>

                      {/* Details Action */}
                      <td className="py-2.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLog(log);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#18181b] hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 text-xs font-medium transition-colors shadow-xs"
                        >
                          <Eye className="w-3 h-3 text-emerald-400" />
                          <span>ตรวจสอบ</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Bottom Status / Pagination Bar */}
        <div className="px-4 py-3 bg-[#141418] border-t border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 text-zinc-400 font-mono text-[11px] flex-wrap">
            <span>
              รวม: <strong className="text-white">{sortedLogs.length.toLocaleString()}</strong> คำขอ
            </span>
            <span>•</span>
            <span>
              SLA 200: <strong className="text-emerald-400">{successPercent}%</strong>
            </span>
            <span>•</span>
            <span>
              Latency เฉลี่ย: <strong className="text-white">{avgLatency}ms</strong>
            </span>
            <span>•</span>
            <span>
              โทเค็นรวม:{' '}
              <strong className="text-cyan-400">{totalTokensSum.toLocaleString()} tok</strong>
            </span>
          </div>

          {pageSize !== -1 && totalPages > 1 && (
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <span className="text-zinc-400 font-mono text-[11px]">
                หน้า {currentPage} จาก {totalPages}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1 rounded bg-[#18181b] hover:bg-zinc-800 text-zinc-300 border border-zinc-700 disabled:opacity-30 disabled:hover:bg-[#18181b] transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1 rounded bg-[#18181b] hover:bg-zinc-800 text-zinc-300 border border-zinc-700 disabled:opacity-30 disabled:hover:bg-[#18181b] transition-colors"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Export Modal Component */}
      <ExportLogsModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        currentLogs={logs}
        filterParams={{
          provider: selectedProviders[0] || undefined,
          model: selectedModel || undefined,
          status: selectedStatuses[0] || undefined,
          search: search || undefined,
        }}
        onExportSuccess={handleExportSuccess}
      />

      {/* Enterprise Full Request/Response Chain & Latency Inspector Modal */}
      {selectedLog && (
        <LogDetailModal
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
        />
      )}
    </div>
  );
};


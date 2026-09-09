import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  X,
  CheckCircle2,
  Copy,
  Check,
  ShieldCheck,
  Layers,
  Database,
  Terminal,
} from 'lucide-react';
import { UsageLogItem } from '../types';
import { api } from '../lib/api';

interface ExportLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLogs: UsageLogItem[];
  filterParams: {
    provider?: string;
    model?: string;
    status?: string;
    search?: string;
  };
  onExportSuccess: (filename: string, count: number) => void;
}

export const ExportLogsModal: React.FC<ExportLogsModalProps> = ({
  isOpen,
  onClose,
  currentLogs,
  filterParams,
  onExportSuccess,
}) => {
  const [exportScope, setExportScope] = useState<'filtered' | 'all'>('filtered');
  const [exporting, setExporting] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  if (!isOpen) return null;

  const exportUrl = api.getLogsExportUrl(
    exportScope === 'filtered' ? filterParams : undefined
  );
  const fullExportApiUrl = `${window.location.origin}${exportUrl}`;

  const escapeCsv = (val: any) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      let logsToExport: UsageLogItem[] = [];

      if (exportScope === 'filtered') {
        logsToExport = currentLogs;
      } else {
        // Fetch all logs from the backend
        logsToExport = await api.getLogs({ limit: 10000 });
      }

      if (logsToExport.length === 0) {
        alert('ไม่พบข้อมูลบันทึกการใช้งานสำหรับการส่งออก');
        return;
      }

      const headers = [
        'Request ID',
        'Timestamp (ISO)',
        'Date UTC',
        'Time UTC',
        'HTTP Status',
        'Status Category',
        'Provider',
        'Model',
        'API Key ID',
        'Key Label',
        'Masked Key',
        'Prompt Tokens (In)',
        'Completion Tokens (Out)',
        'Total Tokens',
        'Latency (ms)',
        'Client Application',
        'Estimated Cost (USD)',
        'Client IP',
        'Error Details',
        'Request Preview',
      ];

      const rows = logsToExport.map((log) => {
        const dateObj = new Date(log.createdAt || log.timestamp || Date.now());
        const statusVal = log.status || log.responseStatus || 200;
        const statusCat =
          statusVal === 200 ? 'SUCCESS' : statusVal === 429 ? 'RATE_LIMIT' : 'ERROR';
        const inTok = log.promptTokens ?? log.inputTokens ?? 0;
        const outTok = log.completionTokens ?? log.outputTokens ?? 0;
        const totalTok = log.totalTokens ?? inTok + outTok;

        return [
          escapeCsv(log.requestId),
          escapeCsv(log.createdAt || log.timestamp || ''),
          escapeCsv(!isNaN(dateObj.getTime()) ? dateObj.toISOString().slice(0, 10) : ''),
          escapeCsv(!isNaN(dateObj.getTime()) ? dateObj.toISOString().slice(11, 19) : ''),
          escapeCsv(statusVal),
          escapeCsv(statusCat),
          escapeCsv(log.provider || log.providerName || ''),
          escapeCsv(log.model || log.modelId || ''),
          escapeCsv(log.apiKeyId || ''),
          escapeCsv(log.keyLabel || 'Key in Pool'),
          escapeCsv(log.maskedKey || ''),
          escapeCsv(inTok),
          escapeCsv(outTok),
          escapeCsv(totalTok),
          escapeCsv(log.latencyMs || 0),
          escapeCsv(log.clientName || 'Internal System'),
          escapeCsv(Number(log.costEstimated || 0).toFixed(6)),
          escapeCsv(log.ipAddress || ''),
          escapeCsv(log.error || ''),
          escapeCsv(log.requestPreview || ''),
        ].join(',');
      });

      // UTF-8 Byte Order Mark (BOM) allows Microsoft Excel, Numbers, and Sheets to open UTF-8 properly
      const csvData = '\uFEFF' + [headers.map(escapeCsv).join(','), ...rows].join('\r\n');

      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10);
      const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '');
      const filename = `freellmhub-usage-logs-${dateStr}-${timeStr}.csv`;

      // Trigger standard browser download
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      onExportSuccess(filename, logsToExport.length);
      onClose();
    } catch (err) {
      console.error('Failed to export CSV', err);
      alert('เกิดข้อผิดพลาดในการส่งออกไฟล์ CSV');
    } finally {
      setExporting(false);
    }
  };

  const copyExportUrl = () => {
    navigator.clipboard.writeText(fullExportApiUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl bg-[#161619] border border-[#27272a] shadow-2xl overflow-hidden text-zinc-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#27272a] bg-[#111113]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-950/60 border border-emerald-800/50 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                ส่งออกบันทึกการใช้งานเป็นไฟล์ CSV (Export Usage Logs)
              </h3>
              <p className="text-[11px] text-zinc-400">
                ดาวน์โหลดข้อมูลเพื่อการตรวจสอบ (Auditing), รายงานการเงิน และวิเคราะห์สถิติ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5 text-xs">
          {/* Export Scope */}
          <div>
            <label className="block font-medium text-zinc-300 mb-2">
              เลือกขอบเขตข้อมูลที่ต้องการส่งออก (Export Scope):
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <label
                className={`p-3 rounded-xl border flex flex-col gap-1 cursor-pointer transition-colors ${
                  exportScope === 'filtered'
                    ? 'bg-emerald-950/20 border-emerald-500 text-white'
                    : 'bg-[#111113] border-[#27272a] text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-semibold text-xs text-white">
                    <input
                      type="radio"
                      name="scope"
                      checked={exportScope === 'filtered'}
                      onChange={() => setExportScope('filtered')}
                      className="accent-emerald-500"
                    />
                    <span>ตามตัวกรองปัจจุบัน</span>
                  </div>
                  <span className="font-mono text-[10px] bg-zinc-800 text-emerald-400 px-1.5 py-0.5 rounded">
                    {currentLogs.length} รายการ
                  </span>
                </div>
                <span className="text-[11px] text-zinc-400 pl-5">
                  เฉพาะข้อมูลที่ตรงกับเงื่อนไขการค้นหาและตัวกรองที่เลือกไว้
                </span>
              </label>

              <label
                className={`p-3 rounded-xl border flex flex-col gap-1 cursor-pointer transition-colors ${
                  exportScope === 'all'
                    ? 'bg-emerald-950/20 border-emerald-500 text-white'
                    : 'bg-[#111113] border-[#27272a] text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-semibold text-xs text-white">
                    <input
                      type="radio"
                      name="scope"
                      checked={exportScope === 'all'}
                      onChange={() => setExportScope('all')}
                      className="accent-emerald-500"
                    />
                    <span>บันทึกทั้งหมดในระบบ</span>
                  </div>
                  <span className="font-mono text-[10px] bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded">
                    ฐานข้อมูล
                  </span>
                </div>
                <span className="text-[11px] text-zinc-400 pl-5">
                  ดึงประวัติการเรียกใช้งานทั้งหมดที่มีบันทึกไว้ในเกตเวย์
                </span>
              </label>
            </div>
          </div>

          {/* Audit & Compliance Columns Summary */}
          <div className="p-3.5 rounded-xl bg-[#111113] border border-[#27272a] space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>คอลัมน์มาตรฐานการตรวจสอบ (Auditing & Reporting Columns):</span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-zinc-400">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Request ID & Timestamp (ISO)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>HTTP Status Code & Category</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Provider & Model Identifier</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Key Label & Masked Token</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Prompt / Completion / Total Tokens</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Gateway Latency (ms)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Client Name & Origin IP</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Estimated Cost & Error Detail</span>
              </div>
            </div>
            <div className="pt-2 border-t border-[#27272a] flex items-center justify-between text-[10px] text-zinc-400">
              <span>การเข้ารหัส: UTF-8 with BOM (เปิดใน Excel / Sheets ได้ทันที ไม่เพี้ยน)</span>
              <span className="text-emerald-400 font-mono">.csv format</span>
            </div>
          </div>

          {/* Automated API / cURL integration */}
          <div className="p-3 rounded-xl bg-[#111113] border border-[#27272a] space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1 text-zinc-300 font-medium">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                <span>REST API Endpoint สำหรับระบบดึงอัตโนมัติ (Automated Auditing):</span>
              </span>
              <button
                onClick={copyExportUrl}
                className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-white px-2 py-0.5 rounded bg-zinc-800 transition-colors"
                title="คัดลอก URL"
              >
                {copiedUrl ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">คัดลอกแล้ว</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>คัดลอก URL</span>
                  </>
                )}
              </button>
            </div>
            <div className="font-mono text-[10px] text-zinc-400 bg-[#161619] p-2 rounded border border-zinc-800 break-all select-all">
              GET {fullExportApiUrl}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 border-t border-[#27272a] bg-[#111113]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition-colors"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-semibold transition-colors disabled:opacity-50"
          >
            <Download className={`w-4 h-4 ${exporting ? 'animate-bounce' : ''}`} />
            <span>{exporting ? 'กำลังสร้างไฟล์ CSV...' : 'ดาวน์โหลดไฟล์ CSV ทันที'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

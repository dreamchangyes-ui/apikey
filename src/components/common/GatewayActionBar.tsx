import React from 'react';
import {
  Sparkles,
  Download,
  Maximize2,
  Minimize2,
  PanelLeftClose,
  PanelLeftOpen,
  EyeOff,
  SlidersHorizontal,
  RefreshCw,
} from 'lucide-react';
import { useDisplay, DisplayScale, TableDensity } from '../../context/DisplayContext';

interface GatewayActionBarProps {
  title?: string;
  badge?: string;
  totalCount?: number;
  itemLabel?: string;
  onSyncFreeModels?: () => void;
  isSyncing?: boolean;
  onExportCsv?: () => void;
  onExportJson?: () => void;
  onRefresh?: () => void;
  isLoading?: boolean;
  extraFilters?: React.ReactNode;
  children?: React.ReactNode;
}

export const GatewayActionBar: React.FC<GatewayActionBarProps> = ({
  title,
  badge,
  totalCount,
  itemLabel = 'รายการ',
  onSyncFreeModels,
  isSyncing = false,
  onExportCsv,
  onExportJson,
  onRefresh,
  isLoading = false,
  extraFilters,
  children,
}) => {
  const {
    scale,
    setScale,
    density,
    setDensity,
    fluidWidth,
    toggleFluidWidth,
    sidebarMode,
    setSidebarMode,
  } = useDisplay();

  return (
    <div className="bg-[#121215] border border-[#27272a] rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-sm">
      {/* Left: Section Header & Count info */}
      <div className="flex items-center flex-wrap gap-2.5 min-w-0">
        {title && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white tracking-tight">{title}</span>
            {badge && (
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                {badge}
              </span>
            )}
          </div>
        )}

        {totalCount !== undefined && (
          <div className="text-xs text-zinc-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>ทั้งหมด</span>
            <strong className="text-white font-mono">{totalCount.toLocaleString()}</strong>
            <span>{itemLabel}</span>
          </div>
        )}

        {extraFilters}
      </div>

      {/* Right: Quick Action Controls */}
      <div className="flex items-center flex-wrap gap-2 ml-auto">
        {children}

        {/* Real-time Refresh */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2 rounded-lg bg-[#18181b] hover:bg-zinc-800 text-zinc-300 hover:text-white border border-[#27272a] text-xs transition-colors disabled:opacity-50"
            title="รีเฟรชข้อมูลล่าสุด"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        )}

        {/* Sync Free Models Real API Trigger */}
        {onSyncFreeModels && (
          <button
            onClick={onSyncFreeModels}
            disabled={isSyncing}
            id="btn-auto-sync-free-models"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
            title="ดึงข้อมูลโมเดลฟรีและข้อกำหนด Rate Limits ล่าสุดจากผู้ให้บริการทุกค่าย"
          >
            <Sparkles className={`w-3.5 h-3.5 fill-black ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'กำลังซิงค์โมเดล...' : 'ดึงโมเดลฟรีอัตโนมัติ'}</span>
          </button>
        )}

        {/* Export Data */}
        {onExportCsv && (
          <button
            onClick={onExportCsv}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#18181b] hover:bg-zinc-800 text-zinc-300 hover:text-white border border-[#27272a] text-xs font-medium transition-colors"
            title="ส่งออกตารางเป็นไฟล์ CSV"
          >
            <Download className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden sm:inline">CSV</span>
          </button>
        )}

        {/* Table Density Switcher */}
        <div className="flex items-center bg-[#18181b] border border-[#27272a] rounded-lg p-0.5" title="ระยะห่างของแถวในตาราง">
          <button
            onClick={() => setDensity('compact')}
            className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
              density === 'compact' ? 'bg-zinc-700 text-white shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            กระชับ
          </button>
          <button
            onClick={() => setDensity('comfortable')}
            className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
              density === 'comfortable' ? 'bg-zinc-700 text-white shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            มาตรฐาน
          </button>
        </div>

        {/* Display Scale (Zoom) for Desktop Monitors */}
        <div className="flex items-center bg-[#18181b] border border-[#27272a] rounded-lg p-0.5" title="ขนาดตัวอักษรสำหรับจอคอมพิวเตอร์">
          <button
            onClick={() => setScale('normal')}
            className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
              scale === 'normal' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            100%
          </button>
          <button
            onClick={() => setScale('large')}
            className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
              scale === 'large' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            115%
          </button>
          <button
            onClick={() => setScale('xlarge')}
            className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
              scale === 'xlarge' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            130%
          </button>
        </div>

        {/* Fluid Width Toggle */}
        <button
          onClick={toggleFluidWidth}
          className={`p-1.5 rounded-lg border text-xs font-medium transition-colors ${
            fluidWidth
              ? 'bg-zinc-800 border-zinc-600 text-white'
              : 'bg-[#18181b] border-[#27272a] text-zinc-400 hover:text-zinc-200'
          }`}
          title={fluidWidth ? 'สลับเป็นโหมดความกว้างมาตรฐาน' : 'ขยายเต็มจอคอมพิวเตอร์ (Full Width)'}
        >
          {fluidWidth ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>

        {/* Sidebar Hide / Focus Mode Toggle */}
        <div className="flex items-center bg-[#18181b] border border-[#27272a] rounded-lg p-0.5">
          <button
            onClick={() => setSidebarMode('expanded')}
            className={`p-1.5 rounded transition-colors ${
              sidebarMode === 'expanded' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title="แสดงเมนูปกติ"
          >
            <PanelLeftOpen className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setSidebarMode('collapsed')}
            className={`p-1.5 rounded transition-colors ${
              sidebarMode === 'collapsed' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title="ย่อเมนูเหลือเฉพาะไอคอน"
          >
            <PanelLeftClose className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setSidebarMode('hidden')}
            className={`p-1.5 rounded transition-colors ${
              sidebarMode === 'hidden' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title="ซ่อนเมนูด้านข้าง (Focus Mode)"
          >
            <EyeOff className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

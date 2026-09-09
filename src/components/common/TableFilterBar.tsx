import React from 'react';
import { Search, X, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { MultiSelectDropdown, MultiSelectOption } from './MultiSelectDropdown';
import { DateRangeDropdown, DateRangeFilterValue } from './DateRangeDropdown';

export interface TableFilterBarProps {
  search: string;
  onSearchChange: (search: string) => void;
  searchPlaceholder?: string;

  // Provider filter
  providers?: MultiSelectOption[];
  selectedProviders: string[];
  onProvidersChange: (selected: string[]) => void;
  providerTitle?: string;

  // Status filter
  statuses?: MultiSelectOption[];
  selectedStatuses: string[];
  onStatusesChange: (selected: string[]) => void;
  statusTitle?: string;

  // Date Range filter
  dateRange: DateRangeFilterValue;
  onDateRangeChange: (val: DateRangeFilterValue) => void;

  // Optional custom extra dropdown (e.g. Models)
  extraDropdown?: React.ReactNode;

  // Reset all
  onReset: () => void;
  totalFilteredCount?: number;
  totalCount?: number;
}

export const TableFilterBar: React.FC<TableFilterBarProps> = ({
  search,
  onSearchChange,
  searchPlaceholder = 'ค้นหาข้อมูล...',
  providers,
  selectedProviders,
  onProvidersChange,
  providerTitle = 'ผู้ให้บริการ',
  statuses,
  selectedStatuses,
  onStatusesChange,
  statusTitle = 'สถานะ',
  dateRange,
  onDateRangeChange,
  extraDropdown,
  onReset,
  totalFilteredCount,
  totalCount,
}) => {
  const hasActiveFilters =
    search.trim().length > 0 ||
    selectedProviders.length > 0 ||
    selectedStatuses.length > 0 ||
    dateRange.preset !== 'all';

  const getDateRangeLabel = () => {
    switch (dateRange.preset) {
      case 'today':
        return 'วันนี้';
      case '24h':
        return '24 ชม. ที่ผ่านมา';
      case '7d':
        return '7 วันที่ผ่านมา';
      case '30d':
        return '30 วันที่ผ่านมา';
      case 'custom':
        return dateRange.startDate && dateRange.endDate
          ? `${dateRange.startDate} ~ ${dateRange.endDate}`
          : 'กำหนดช่วงเวลาเอง';
      default:
        return null;
    }
  };

  const dateLabel = getDateRangeLabel();

  return (
    <div className="space-y-2.5">
      {/* Main Filter Bar Row */}
      <div className="p-2.5 rounded-xl bg-[#121215] border border-zinc-800/90 shadow-lg flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
        {/* Search Input Box */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-[#18181c] border border-zinc-800/80 rounded-lg pl-9 pr-8 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-600 transition-all"
          />
          {search && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-0.5 rounded transition-colors"
              title="ล้างข้อความค้นหา"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Multi-Select & Date Filter Controls */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Provider Multi-Select */}
          {providers && providers.length > 0 && (
            <MultiSelectDropdown
              title={providerTitle}
              options={providers}
              selectedValues={selectedProviders}
              onChange={onProvidersChange}
              placeholder="ทุกผู้ให้บริการ"
            />
          )}

          {/* Status Multi-Select */}
          {statuses && statuses.length > 0 && (
            <MultiSelectDropdown
              title={statusTitle}
              options={statuses}
              selectedValues={selectedStatuses}
              onChange={onStatusesChange}
              placeholder="ทุกสถานะ"
              showSearch={false}
            />
          )}

          {/* Extra custom slot (like model selector) */}
          {extraDropdown}

          {/* Date Range Dropdown */}
          <DateRangeDropdown value={dateRange} onChange={onDateRangeChange} />

          {/* Quick Clear Button if filters active */}
          {hasActiveFilters && (
            <button
              onClick={onReset}
              className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white border border-zinc-700 transition-colors shrink-0"
              title="รีเซ็ตตัวกรองทั้งหมด"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Active Filter Chips / Pills Display */}
      {hasActiveFilters && (
        <div className="flex items-center gap-1.5 flex-wrap px-1 text-xs animate-in fade-in duration-150">
          <span className="text-zinc-500 text-[11px] font-mono flex items-center gap-1">
            <SlidersHorizontal className="w-3 h-3" />
            ตัวกรองที่เลือก:
          </span>

          {/* Search Chip */}
          {search && (
            <span className="inline-flex items-center gap-1 bg-zinc-800 text-zinc-200 px-2.5 py-0.5 rounded-full text-[11px] border border-zinc-700">
              <span className="text-zinc-400">ค้นหา:</span>
              <strong className="text-white max-w-[150px] truncate">"{search}"</strong>
              <button
                onClick={() => onSearchChange('')}
                className="hover:text-rose-400 ml-0.5 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {/* Provider Chips */}
          {selectedProviders.map((pVal) => {
            const match = providers?.find((o) => o.value === pVal);
            return (
              <span
                key={pVal}
                className="inline-flex items-center gap-1 bg-blue-500/10 text-blue-300 border border-blue-500/20 px-2.5 py-0.5 rounded-full text-[11px]"
              >
                <span className="text-blue-400/80">{providerTitle}:</span>
                <span className="font-semibold">{match?.label || pVal}</span>
                <button
                  onClick={() => onProvidersChange(selectedProviders.filter((v) => v !== pVal))}
                  className="hover:text-rose-400 ml-0.5 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}

          {/* Status Chips */}
          {selectedStatuses.map((sVal) => {
            const match = statuses?.find((o) => o.value === sVal);
            return (
              <span
                key={sVal}
                className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-[11px]"
              >
                <span className="text-emerald-400/80">{statusTitle}:</span>
                <span className="font-semibold">{match?.label || sVal}</span>
                <button
                  onClick={() => onStatusesChange(selectedStatuses.filter((v) => v !== sVal))}
                  className="hover:text-rose-400 ml-0.5 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}

          {/* Date Range Chip */}
          {dateLabel && (
            <span className="inline-flex items-center gap-1 bg-purple-500/10 text-purple-300 border border-purple-500/20 px-2.5 py-0.5 rounded-full text-[11px]">
              <span className="text-purple-400/80">ช่วงเวลา:</span>
              <span className="font-semibold">{dateLabel}</span>
              <button
                onClick={() => onDateRangeChange({ preset: 'all' })}
                className="hover:text-rose-400 ml-0.5 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {/* Result Count and Clear All */}
          <div className="flex items-center gap-2 ml-auto">
            {totalFilteredCount !== undefined && totalCount !== undefined && (
              <span className="text-[11px] font-mono text-zinc-400">
                พบ <strong className="text-white">{totalFilteredCount}</strong> จาก {totalCount} รายการ
              </span>
            )}
            <button
              onClick={onReset}
              className="text-[11px] text-zinc-400 hover:text-white underline underline-offset-2 transition-colors ml-1"
            >
              ล้างทั้งหมด
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

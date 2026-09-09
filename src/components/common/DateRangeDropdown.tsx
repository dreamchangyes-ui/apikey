import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, Check, X, Clock } from 'lucide-react';

export type DateRangePreset = 'all' | 'today' | '24h' | '7d' | '30d' | 'custom';

export interface DateRangeFilterValue {
  preset: DateRangePreset;
  startDate?: string;
  endDate?: string;
}

interface DateRangeDropdownProps {
  id?: string;
  value: DateRangeFilterValue;
  onChange: (val: DateRangeFilterValue) => void;
}

export const DateRangeDropdown: React.FC<DateRangeDropdownProps> = ({ id, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const [customStart, setCustomStart] = useState(value.startDate || '');
  const [customEnd, setCustomEnd] = useState(value.endDate || '');

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const presets: { key: DateRangePreset; label: string; desc: string }[] = [
    { key: 'all', label: 'ทั้งหมด (All Time)', desc: 'ไม่จำกัดช่วงเวลา' },
    { key: 'today', label: 'วันนี้ (Today)', desc: 'ตั้งแต่ 00:00 วันนี้' },
    { key: '24h', label: '24 ชั่วโมงที่ผ่านมา', desc: 'ย้อนหลัง 24 ชม.' },
    { key: '7d', label: '7 วันที่ผ่านมา (7 Days)', desc: 'สัปดาห์ล่าสุด' },
    { key: '30d', label: '30 วันที่ผ่านมา (30 Days)', desc: 'เดือนล่าสุด' },
    { key: 'custom', label: 'กำหนดช่วงวันเอง...', desc: 'เลือกวันที่เริ่มต้น - สิ้นสุด' },
  ];

  const handleSelectPreset = (preset: DateRangePreset) => {
    if (preset === 'custom') {
      onChange({
        preset: 'custom',
        startDate: customStart,
        endDate: customEnd,
      });
    } else {
      onChange({ preset });
      setIsOpen(false);
    }
  };

  const handleApplyCustom = () => {
    onChange({
      preset: 'custom',
      startDate: customStart,
      endDate: customEnd,
    });
    setIsOpen(false);
  };

  const getLabel = () => {
    if (value.preset === 'all') return 'ทั้งหมด';
    if (value.preset === 'today') return 'วันนี้';
    if (value.preset === '24h') return '24 ชม. ที่ผ่านมา';
    if (value.preset === '7d') return '7 วันที่ผ่านมา';
    if (value.preset === '30d') return '30 วันที่ผ่านมา';
    if (value.preset === 'custom') {
      if (value.startDate && value.endDate) {
        return `${value.startDate} ถึง ${value.endDate}`;
      }
      if (value.startDate) return `ตั้งแต่ ${value.startDate}`;
      return 'กำหนดเอง';
    }
    return 'ช่วงเวลา';
  };

  const isActive = value.preset !== 'all';

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      {/* Trigger Button */}
      <button
        id={id}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
          isActive
            ? 'bg-zinc-800/90 text-white border-zinc-600 shadow-xs'
            : 'bg-[#141418] text-zinc-300 border-zinc-800 hover:bg-zinc-800 hover:text-white'
        }`}
      >
        <div className="flex items-center gap-1.5 truncate max-w-[190px]">
          <Calendar className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <span className="text-zinc-400">ช่วงเวลา:</span>
          <span className="font-semibold text-white truncate">{getLabel()}</span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-72 rounded-xl bg-[#141418] border border-zinc-700/80 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <div className="p-2 border-b border-zinc-800 bg-[#18181f] flex items-center justify-between text-[11px]">
            <span className="font-semibold text-zinc-300 font-mono flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-zinc-400" />
              ตัวกรองช่วงเวลา (Date Range)
            </span>
            {isActive && (
              <button
                type="button"
                onClick={() => handleSelectPreset('all')}
                className="text-zinc-400 hover:text-white text-[10px]"
              >
                รีเซ็ต
              </button>
            )}
          </div>

          <div className="p-1.5 space-y-0.5">
            {presets.map((p) => {
              const isSelected = value.preset === p.key;
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => handleSelectPreset(p.key)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors text-left ${
                    isSelected
                      ? 'bg-zinc-800 text-white font-medium'
                      : 'text-zinc-300 hover:bg-zinc-800/50 hover:text-white'
                  }`}
                >
                  <div>
                    <div className="font-medium">{p.label}</div>
                    <div className="text-[10px] text-zinc-500 font-mono">{p.desc}</div>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Custom Date Inputs if 'custom' is selected */}
          {value.preset === 'custom' && (
            <div className="p-3 border-t border-zinc-800 bg-[#121215] space-y-2">
              <div className="text-[11px] font-semibold text-zinc-300">ระบุวันที่ต้องการ:</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[10px] text-zinc-400 block mb-1">วันที่เริ่มต้น:</label>
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="w-full bg-[#18181b] border border-zinc-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-zinc-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 block mb-1">วันที่สิ้นสุด:</label>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="w-full bg-[#18181b] border border-zinc-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-zinc-500"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleApplyCustom}
                className="w-full py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded text-xs transition-colors mt-1"
              >
                นำตัวกรองช่วงเวลาไปใช้
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

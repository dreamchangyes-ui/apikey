import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X, Search, Filter } from 'lucide-react';

export interface MultiSelectOption {
  value: string;
  label: string;
  count?: number;
  badgeColor?: string;
  sublabel?: string;
}

interface MultiSelectDropdownProps {
  id?: string;
  title: string;
  icon?: React.ReactNode;
  options: MultiSelectOption[];
  selectedValues: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  showSearch?: boolean;
}

export const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  id,
  title,
  icon,
  options,
  selectedValues,
  onChange,
  placeholder = 'เลือกทั้งหมด',
  showSearch = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

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

  const toggleOption = (val: string) => {
    if (selectedValues.includes(val)) {
      onChange(selectedValues.filter((v) => v !== val));
    } else {
      onChange([...selectedValues, val]);
    }
  };

  const handleSelectAll = () => {
    onChange(options.map((o) => o.value));
  };

  const handleClearAll = () => {
    onChange([]);
  };

  const filteredOptions = options.filter(
    (o) =>
      o.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.sublabel && o.sublabel.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const isAllSelected = options.length > 0 && selectedValues.length === options.length;
  const isNoneSelected = selectedValues.length === 0;

  // Display text on trigger button
  const getButtonText = () => {
    if (isNoneSelected) {
      return placeholder;
    }
    if (isAllSelected) {
      return `ทั้งหมด (${options.length})`;
    }
    if (selectedValues.length === 1) {
      const match = options.find((o) => o.value === selectedValues[0]);
      return match ? match.label : selectedValues[0];
    }
    return `${title} (${selectedValues.length})`;
  };

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      {/* Trigger Button */}
      <button
        id={id}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
          selectedValues.length > 0
            ? 'bg-zinc-800/90 text-white border-zinc-600 shadow-xs'
            : 'bg-[#141418] text-zinc-300 border-zinc-800 hover:bg-zinc-800 hover:text-white'
        }`}
      >
        <div className="flex items-center gap-1.5 truncate max-w-[170px]">
          {icon || <Filter className="w-3.5 h-3.5 text-zinc-400 shrink-0" />}
          <span className="text-zinc-400">{title}:</span>
          <span className="font-semibold text-white truncate">{getButtonText()}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {selectedValues.length > 0 && (
            <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] flex items-center justify-center font-bold">
              {selectedValues.length}
            </span>
          )}
          <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-64 rounded-xl bg-[#141418] border border-zinc-700/80 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {/* Header & Quick Actions */}
          <div className="p-2 border-b border-zinc-800 bg-[#18181f] flex items-center justify-between text-[11px]">
            <span className="font-semibold text-zinc-300 font-mono flex items-center gap-1">
              {title}
              <span className="text-zinc-500 font-normal">({selectedValues.length}/{options.length})</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-emerald-400 hover:text-emerald-300 hover:underline transition-colors"
              >
                เลือกทั้งหมด
              </button>
              <span className="text-zinc-600">•</span>
              <button
                type="button"
                onClick={handleClearAll}
                className="text-zinc-400 hover:text-rose-400 hover:underline transition-colors"
              >
                ล้าง
              </button>
            </div>
          </div>

          {/* Search box inside dropdown if many options */}
          {showSearch && options.length > 5 && (
            <div className="p-2 border-b border-zinc-800 bg-[#121215]">
              <div className="relative">
                <Search className="w-3 h-3 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={`ค้นหา${title}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#18181b] border border-zinc-700/60 rounded-md pl-7 pr-2 py-1 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                  autoFocus
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Options List */}
          <div className="max-h-56 overflow-y-auto p-1.5 space-y-0.5">
            {filteredOptions.length === 0 ? (
              <div className="py-4 text-center text-zinc-500 text-xs">
                ไม่พบรายการที่ค้นหา
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isChecked = selectedValues.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggleOption(opt.value)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors text-left ${
                      isChecked
                        ? 'bg-zinc-800/80 text-white font-medium'
                        : 'text-zinc-300 hover:bg-zinc-800/50 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {/* Checkbox Icon */}
                      <div
                        className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                          isChecked
                            ? 'bg-emerald-500 border-emerald-500 text-black'
                            : 'border-zinc-600 bg-zinc-900'
                        }`}
                      >
                        {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>

                      <div className="truncate">
                        <span className="truncate">{opt.label}</span>
                        {opt.sublabel && (
                          <span className="ml-1.5 text-[10px] text-zinc-500 font-mono">
                            {opt.sublabel}
                          </span>
                        )}
                      </div>
                    </div>

                    {opt.count !== undefined && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800 shrink-0 ml-2">
                        {opt.count}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer status summary */}
          <div className="p-2 border-t border-zinc-800 bg-[#16161c] flex items-center justify-between text-[11px] text-zinc-400">
            <span>
              {isNoneSelected
                ? 'แสดงข้อมูลทั้งหมด (ไม่มีการกรอง)'
                : `กรองเฉพาะ ${selectedValues.length} รายการ`}
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-[10px] font-medium"
            >
              เสร็จสิ้น
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

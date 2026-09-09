import React from 'react';
import {
  LayoutDashboard,
  Cpu,
  KeyRound,
  Boxes,
  RotateCw,
  ShieldCheck,
  Terminal,
  FileText,
  AlertTriangle,
  Activity,
  Settings,
  BookOpen,
  X,
} from 'lucide-react';
import { ViewTab } from '../types';
import { useDisplay } from '../context/DisplayContext';

interface SidebarProps {
  currentTab: ViewTab;
  onSelectTab: (tab: ViewTab) => void;
  isOpen: boolean;
  onClose: () => void;
  errorCount?: number;
}

interface NavItem {
  id: ViewTab;
  label: string;
  icon: React.ElementType;
  badge?: string | number;
  badgeColor?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpen,
  onClose,
  errorCount = 0,
}) => {
  const { sidebarMode, scale } = useDisplay();

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'แดชบอร์ดภาพรวม', icon: LayoutDashboard },
    { id: 'providers', label: 'ผู้ให้บริการ AI', icon: Cpu },
    { id: 'api-keys', label: 'จัดการ API Keys', icon: KeyRound },
    { id: 'models', label: 'สารบบโมเดล AI', icon: Boxes },
    { id: 'key-pool', label: 'พูลคีย์และการหมุนเวียน', icon: RotateCw },
    { id: 'client-keys', label: 'คีย์สำหรับไคลเอนต์', icon: ShieldCheck },
    { id: 'playground', label: 'ทดสอบ API Gateway', icon: Terminal, badge: 'v1' },
    { id: 'api-docs', label: 'เอกสารอ้างอิง API', icon: BookOpen },
    { id: 'logs', label: 'ประวัติการใช้งาน', icon: FileText },
    {
      id: 'errors',
      label: 'ติดตามข้อผิดพลาด',
      icon: AlertTriangle,
      badge: errorCount > 0 ? errorCount : undefined,
      badgeColor: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
    },
    { id: 'health', label: 'สถานะระบบและความพร้อม', icon: Activity },
    { id: 'settings', label: 'การตั้งค่าระบบ', icon: Settings },
  ];

  if (sidebarMode === 'hidden' && !isOpen) {
    return null;
  }

  const isCollapsed = sidebarMode === 'collapsed';

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          id="sidebar-mobile-backdrop"
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container (Sticky on desktop, never scrolls away with page content) */}
      <aside
        id="app-sidebar"
        className={`fixed lg:sticky top-0 left-0 h-screen z-40 bg-[#0c0c0e] border-r border-[#27272a] flex flex-col shrink-0 overflow-hidden transition-all duration-200 ease-in-out ${
          isCollapsed ? 'lg:w-20 w-64' : 'lg:w-64 w-64'
        } ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className={`h-16 border-b border-[#27272a] flex items-center justify-between shrink-0 ${isCollapsed ? 'px-3' : 'px-4'}`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-zinc-100 to-zinc-400 flex items-center justify-center text-black font-black text-sm tracking-wider shadow-sm shrink-0">
              LH
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <div className="text-sm font-semibold text-white tracking-tight flex items-center gap-1.5 truncate">
                  Free LLM Hub
                  <span className="text-[10px] px-1.5 py-0.2 bg-zinc-800 text-zinc-400 rounded border border-zinc-700">
                    PRO
                  </span>
                </div>
                <div className="text-[11px] text-zinc-400 truncate">ระบบจัดการ AI รวมศูนย์</div>
              </div>
            )}
          </div>

          {/* Mobile Close Button only (Desktop collapse is controlled via Topbar to eliminate duplicate buttons) */}
          <button
            id="sidebar-close-btn"
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
          {!isCollapsed && (
            <div className="px-3 py-1 text-[11px] font-medium tracking-wider text-zinc-400 uppercase">
              การจัดการหลัก
            </div>
          )}

          {navItems.slice(0, 6).map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => {
                  onSelectTab(item.id);
                  onClose();
                }}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center ${
                  isCollapsed ? 'justify-center px-2 py-2.5' : 'justify-between px-3 py-2'
                } rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-zinc-800/90 text-white font-semibold border border-zinc-700/80 shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                }`}
              >
                <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2.5'}`}>
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-zinc-100' : 'text-zinc-400'}`} />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </div>
                {!isCollapsed && item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                      item.badgeColor || 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {!isCollapsed && (
            <div className="pt-4 px-3 py-1 text-[11px] font-medium tracking-wider text-zinc-400 uppercase">
              เกตเวย์และการตรวจสอบ
            </div>
          )}

          {navItems.slice(6).map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => {
                  onSelectTab(item.id);
                  onClose();
                }}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center ${
                  isCollapsed ? 'justify-center px-2 py-2.5' : 'justify-between px-3 py-2'
                } rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-zinc-800/90 text-white font-semibold border border-zinc-700/80 shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                }`}
              >
                <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2.5'}`}>
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-zinc-100' : 'text-zinc-400'}`} />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </div>
                {!isCollapsed && item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                      item.badgeColor || 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer Gateway Info */}
        <div className="p-2.5 border-t border-[#27272a] bg-[#09090b]">
          {!isCollapsed ? (
            <div className="p-2 rounded-lg bg-[#111113] border border-[#27272a] space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-zinc-400">เกตเวย์</span>
                <span className="font-mono text-emerald-400 text-[10px] bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">
                  ONLINE
                </span>
              </div>
              <div className="text-[10px] text-zinc-400 font-mono truncate">
                /api/v1/chat/completions
              </div>
            </div>
          ) : (
            <div className="flex justify-center" title="เกตเวย์เปิดใช้งานปกติ">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

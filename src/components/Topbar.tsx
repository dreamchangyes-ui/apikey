import React, { useState } from 'react';
import {
  Menu,
  Search,
  Bell,
  CheckCircle2,
  ChevronDown,
  Shield,
  LogOut,
  Sparkles,
  Terminal,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { UserProfile, UserRole, ViewTab } from '../types';
import { useDisplay } from '../context/DisplayContext';

interface TopbarProps {
  onToggleSidebar: () => void;
  currentUser: UserProfile;
  onChangeRole: (role: UserRole) => void;
  onOpenLogin: () => void;
  onNavigate: (tab: ViewTab) => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  onToggleSidebar,
  currentUser,
  onChangeRole,
  onOpenLogin,
  onNavigate,
}) => {
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { sidebarMode, toggleSidebarCollapse } = useDisplay();

  const notifications = [
    {
      id: 1,
      title: 'คีย์ Groq #3 ติด Rate Limit',
      desc: 'เริ่มระบบคูลดาวน์อัตโนมัติ สลับไปใช้คีย์ #1 ทันที (Round Robin)',
      time: '8 นาทีที่แล้ว',
      type: 'warning',
    },
    {
      id: 2,
      title: 'การตรวจเช็คสุขภาพระบบผ่านทั้งหมด',
      desc: 'ผู้ให้บริการ 8 จาก 8 ค่ายตอบสนองปกติ เวลาแฝงเฉลี่ย 118ms',
      time: '24 นาทีที่แล้ว',
      type: 'success',
    },
    {
      id: 3,
      title: 'ออกคีย์ใหม่สำหรับไคลเอนต์สำเร็จ',
      desc: 'fk_live_prod ได้รับสิทธิ์เข้าถึง 10 โมเดล',
      time: '2 ชม. ที่แล้ว',
      type: 'info',
    },
  ];

  return (
    <header
      id="app-topbar"
      className="h-16 px-4 lg:px-6 bg-[#0c0c0e]/95 backdrop-blur-md border-b border-[#27272a] flex items-center justify-between sticky top-0 z-30"
    >
      {/* Left side: Hamburger, Desktop Sidebar Toggle & Search */}
      <div className="flex items-center gap-2 lg:gap-3 flex-1 max-w-xl">
        {/* Mobile menu button */}
        <button
          id="topbar-toggle-sidebar"
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Single Desktop Sidebar Toggle Button (Icon-only) */}
        <button
          id="topbar-desktop-sidebar-toggle"
          onClick={toggleSidebarCollapse}
          className="hidden lg:flex items-center justify-center p-2 rounded-lg bg-[#111113] hover:bg-zinc-800 text-zinc-300 hover:text-white border border-[#27272a] transition-colors shrink-0"
          title={
            sidebarMode === 'collapsed'
              ? 'ขยายแถบเมนูด้านข้าง'
              : 'ย่อแถบเมนูด้านข้าง'
          }
          aria-label={sidebarMode === 'collapsed' ? 'ขยายแถบเมนู' : 'ย่อแถบเมนู'}
        >
          {sidebarMode === 'collapsed' ? (
            <PanelLeftOpen className="w-4 h-4 text-emerald-400" />
          ) : (
            <PanelLeftClose className="w-4 h-4 text-zinc-400" />
          )}
        </button>

        {/* Search Bar */}
        <div className="relative w-full">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="topbar-global-search"
            type="text"
            placeholder="ค้นหาผู้ให้บริการ, โมเดล, คีย์ไคลเอนต์ หรือประวัติคำขอ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#111113] border border-[#27272a] rounded-lg pl-9 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-400 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-colors"
          />
        </div>
      </div>

      {/* Right side: Status, Quick Test, Notifications, User & RBAC */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Real-time System Status */}
        <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-950/40 border border-emerald-900/40 text-[11px] text-emerald-400 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          เกตเวย์เปิดใช้งานปกติ
        </div>

        {/* Quick Test API Gateway Button */}
        <button
          id="topbar-test-gateway-btn"
          onClick={() => onNavigate('playground')}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white text-xs font-medium border border-zinc-700 transition-colors"
        >
          <Terminal className="w-3.5 h-3.5 text-emerald-400" />
          <span>ทดสอบ API</span>
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            id="topbar-notifications-btn"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
          </button>

          {showNotifications && (
            <div
              id="topbar-notifications-popover"
              className="absolute right-0 mt-2 w-80 bg-[#111113] border border-[#27272a] rounded-xl shadow-2xl p-3 z-50 text-left"
            >
              <div className="flex items-center justify-between pb-2 border-b border-[#27272a]">
                <span className="text-xs font-semibold text-white">การแจ้งเตือนระบบ</span>
                <span className="text-[10px] text-zinc-400 font-mono">แจ้งเตือนสด</span>
              </div>
              <div className="divide-y divide-[#27272a] max-h-64 overflow-y-auto">
                {notifications.map((n) => (
                  <div key={n.id} className="py-2.5 space-y-0.5">
                    <div className="flex items-center justify-between text-xs font-medium text-zinc-200">
                      <span>{n.title}</span>
                      <span className="text-[10px] text-zinc-400">{n.time}</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">{n.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile & Role Switcher */}
        <div className="relative">
          <button
            id="topbar-user-menu-btn"
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-zinc-800/60 border border-transparent hover:border-zinc-700 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-zinc-700 to-zinc-500 flex items-center justify-center text-white text-xs font-bold ring-1 ring-zinc-700">
              {currentUser.name.slice(0, 1)}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-medium text-white flex items-center gap-1.5">
                {currentUser.name.split(' ')[0]}
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
                    currentUser.role === 'ADMIN'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : currentUser.role === 'OPERATOR'
                      ? 'bg-indigo-950 text-indigo-400 border border-indigo-800'
                      : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                  }`}
                >
                  {currentUser.role}
                </span>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
          </button>

          {/* Role & Account Dropdown */}
          {showRoleMenu && (
            <div
              id="topbar-user-dropdown"
              className="absolute right-0 mt-2 w-56 bg-[#111113] border border-[#27272a] rounded-xl shadow-2xl p-2 z-50 text-left"
            >
              <div className="px-2.5 py-2 border-b border-[#27272a] mb-1">
                <div className="text-xs font-semibold text-white">{currentUser.name}</div>
                <div className="text-[11px] text-zinc-400 truncate">{currentUser.email}</div>
              </div>

              <div className="px-2 py-1 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                สลับบทบาทผู้ใช้ (RBAC Demo)
              </div>

              {(['ADMIN', 'OPERATOR', 'VIEWER'] as UserRole[]).map((r) => (
                <button
                  key={r}
                  id={`role-switch-${r.toLowerCase()}`}
                  onClick={() => {
                    onChangeRole(r);
                    setShowRoleMenu(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                    currentUser.role === r
                      ? 'bg-zinc-800 text-white font-medium'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5 text-zinc-400" />
                    <span>
                      {r === 'ADMIN'
                        ? 'ผู้ดูแลระบบ (ADMIN)'
                        : r === 'OPERATOR'
                        ? 'ผู้ควบคุมระบบ (OPERATOR)'
                        : 'ผู้ดูข้อมูล (VIEWER)'}
                    </span>
                  </div>
                  {currentUser.role === r && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                </button>
              ))}

              <div className="border-t border-[#27272a] mt-1 pt-1">
                <button
                  id="topbar-login-switch-btn"
                  onClick={() => {
                    setShowRoleMenu(false);
                    onOpenLogin();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs text-zinc-400 hover:text-white hover:bg-zinc-800/40 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>เข้าสู่ระบบด้วยบัญชีอื่น</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

import React, { useState, useEffect } from 'react';
import { ViewTab, UserProfile, UserRole } from './types';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { LoginModal } from './components/LoginModal';
import { DashboardView } from './components/views/DashboardView';
import { ProvidersView } from './components/views/ProvidersView';
import { ApiKeysView } from './components/views/ApiKeysView';
import { ModelsView } from './components/views/ModelsView';
import { KeyPoolView } from './components/views/KeyPoolView';
import { ClientKeysView } from './components/views/ClientKeysView';
import { GatewayPlaygroundView } from './components/views/GatewayPlaygroundView';
import { ApiDocsView } from './components/views/ApiDocsView';
import { LogsView } from './components/views/LogsView';
import { ErrorsView } from './components/views/ErrorsView';
import { HealthView } from './components/views/HealthView';
import { SettingsView } from './components/views/SettingsView';
import { api } from './lib/api';
import { DisplayProvider, useDisplay } from './context/DisplayContext';

function AppContent() {
  const [currentTab, setCurrentTab] = useState<ViewTab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [errorCount, setErrorCount] = useState(0);

  const { fluidWidth, sidebarMode, textScaleClass } = useDisplay();

  const [currentUser, setCurrentUser] = useState<UserProfile>({
    id: 'user_admin',
    email: 'admin@freellmhub.dev',
    name: 'ผู้ดูแลระบบ (Admin)',
    role: 'ADMIN',
  });

  // Sync error count badge
  useEffect(() => {
    const fetchErrorCount = async () => {
      try {
        const errors = await api.getErrors();
        setErrorCount(errors.filter((e) => !e.resolved).length);
      } catch (e) {
        // silent fail
      }
    };
    fetchErrorCount();
    const timer = setInterval(fetchErrorCount, 30000);
    return () => clearInterval(timer);
  }, []);

  const handleChangeRole = (role: UserRole) => {
    setCurrentUser((prev) => ({
      ...prev,
      role,
      name:
        role === 'ADMIN'
          ? 'ผู้ดูแลระบบ (Admin)'
          : role === 'OPERATOR'
          ? 'เจ้าหน้าที่ระบบ (Operator)'
          : 'ผู้ตรวจสอบ (Auditor)',
    }));
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex font-sans antialiased selection:bg-zinc-800 selection:text-white">
      {/* Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        errorCount={errorCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-200">
        {/* Topbar */}
        <Topbar
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          currentUser={currentUser}
          onChangeRole={handleChangeRole}
          onOpenLogin={() => setIsLoginModalOpen(true)}
          onNavigate={(tab) => setCurrentTab(tab)}
        />

        {/* View Body */}
        <main
          className={`flex-1 transition-all duration-200 ${textScaleClass.padding} ${
            fluidWidth ? 'w-full px-4 lg:px-8' : 'max-w-7xl w-full mx-auto'
          }`}
        >
          {currentTab === 'dashboard' && <DashboardView onNavigate={setCurrentTab} />}
          {currentTab === 'providers' && <ProvidersView userRole={currentUser.role} />}
          {currentTab === 'api-keys' && <ApiKeysView userRole={currentUser.role} />}
          {currentTab === 'models' && <ModelsView userRole={currentUser.role} />}
          {currentTab === 'key-pool' && <KeyPoolView userRole={currentUser.role} />}
          {currentTab === 'client-keys' && <ClientKeysView userRole={currentUser.role} />}
          {currentTab === 'playground' && <GatewayPlaygroundView />}
          {currentTab === 'api-docs' && <ApiDocsView />}
          {currentTab === 'logs' && <LogsView userRole={currentUser.role} />}
          {currentTab === 'errors' && <ErrorsView userRole={currentUser.role} />}
          {currentTab === 'health' && <HealthView />}
          {currentTab === 'settings' && <SettingsView userRole={currentUser.role} />}
        </main>
      </div>

      {/* Login & Auth Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setIsLoginModalOpen(false);
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <DisplayProvider>
      <AppContent />
    </DisplayProvider>
  );
}

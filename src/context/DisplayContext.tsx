import React, { createContext, useContext, useState } from 'react';

export type DisplayScale = 'normal' | 'large' | 'xlarge';
export type SidebarMode = 'expanded' | 'collapsed' | 'hidden';
export type TableDensity = 'compact' | 'comfortable' | 'spacious';

interface DisplayContextType {
  scale: DisplayScale;
  setScale: (scale: DisplayScale) => void;
  density: TableDensity;
  setDensity: (density: TableDensity) => void;
  fluidWidth: boolean;
  setFluidWidth: (val: boolean) => void;
  toggleFluidWidth: () => void;
  sidebarMode: SidebarMode;
  setSidebarMode: (mode: SidebarMode) => void;
  toggleSidebarCollapse: () => void;
  // Dynamic CSS classes for scaled typography & professional desktop display
  textScaleClass: {
    heading: string;
    subheading: string;
    body: string;
    caption: string;
    mono: string;
    th: string;
    td: string;
    btn: string;
    input: string;
    padding: string;
    tableRowHeight: string;
  };
}

const DisplayContext = createContext<DisplayContextType | undefined>(undefined);

export const DisplayProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [scale, setScaleState] = useState<DisplayScale>(() => {
    return (localStorage.getItem('freellm_scale') as DisplayScale) || 'large';
  });

  const [density, setDensityState] = useState<TableDensity>(() => {
    return (localStorage.getItem('freellm_density') as TableDensity) || 'comfortable';
  });

  const [fluidWidth, setFluidWidthState] = useState<boolean>(() => {
    const saved = localStorage.getItem('freellm_fluid_width');
    return saved !== null ? saved === 'true' : true;
  });

  const [sidebarMode, setSidebarModeState] = useState<SidebarMode>(() => {
    return (localStorage.getItem('freellm_sidebar_mode') as SidebarMode) || 'expanded';
  });

  const setScale = (newScale: DisplayScale) => {
    setScaleState(newScale);
    localStorage.setItem('freellm_scale', newScale);
  };

  const setDensity = (newDensity: TableDensity) => {
    setDensityState(newDensity);
    localStorage.setItem('freellm_density', newDensity);
  };

  const setFluidWidth = (val: boolean) => {
    setFluidWidthState(val);
    localStorage.setItem('freellm_fluid_width', String(val));
  };

  const toggleFluidWidth = () => setFluidWidth(!fluidWidth);

  const setSidebarMode = (mode: SidebarMode) => {
    setSidebarModeState(mode);
    localStorage.setItem('freellm_sidebar_mode', mode);
  };

  const toggleSidebarCollapse = () => {
    if (sidebarMode === 'expanded') {
      setSidebarMode('collapsed');
    } else {
      setSidebarMode('expanded');
    }
  };

  // Typography & Layout Scaler
  const textScaleClass = {
    normal: {
      heading: 'text-lg font-bold',
      subheading: 'text-xs text-zinc-400',
      body: 'text-xs text-zinc-300',
      caption: 'text-[11px] text-zinc-400',
      mono: 'text-xs font-mono',
      th: density === 'compact' ? 'py-2 px-3 text-[11px] font-semibold' : 'py-2.5 px-3.5 text-xs font-semibold',
      td: density === 'compact' ? 'py-1.5 px-3 text-xs' : 'py-2.5 px-3.5 text-xs',
      btn: 'px-3 py-1.5 text-xs',
      input: 'px-3 py-1.5 text-xs',
      padding: 'p-4 lg:p-6',
      tableRowHeight: density === 'compact' ? 'h-8' : 'h-10',
    },
    large: {
      heading: 'text-xl font-bold',
      subheading: 'text-sm text-zinc-300',
      body: 'text-sm text-zinc-200',
      caption: 'text-xs text-zinc-400',
      mono: 'text-sm font-mono',
      th: density === 'compact' ? 'py-2.5 px-3.5 text-xs font-semibold' : 'py-3.5 px-4 text-sm font-semibold',
      td: density === 'compact' ? 'py-2 px-3.5 text-sm' : 'py-3 px-4 text-sm',
      btn: 'px-3.5 py-2 text-sm',
      input: 'px-3.5 py-2 text-sm',
      padding: 'p-5 lg:p-8',
      tableRowHeight: density === 'compact' ? 'h-10' : 'h-12',
    },
    xlarge: {
      heading: 'text-2xl font-black',
      subheading: 'text-base text-zinc-300',
      body: 'text-base text-zinc-100',
      caption: 'text-sm text-zinc-400',
      mono: 'text-base font-mono',
      th: density === 'compact' ? 'py-3 px-4 text-sm font-bold' : 'py-4 px-5 text-base font-bold',
      td: density === 'compact' ? 'py-2.5 px-4 text-base' : 'py-3.5 px-5 text-base',
      btn: 'px-4.5 py-2.5 text-base font-semibold',
      input: 'px-4 py-2.5 text-base',
      padding: 'p-6 lg:p-10',
      tableRowHeight: density === 'compact' ? 'h-12' : 'h-14',
    },
  }[scale];

  return (
    <DisplayContext.Provider
      value={{
        scale,
        setScale,
        density,
        setDensity,
        fluidWidth,
        setFluidWidth,
        toggleFluidWidth,
        sidebarMode,
        setSidebarMode,
        toggleSidebarCollapse,
        textScaleClass,
      }}
    >
      {children}
    </DisplayContext.Provider>
  );
};

export const useDisplay = () => {
  const context = useContext(DisplayContext);
  if (!context) {
    throw new Error('useDisplay must be used within a DisplayProvider');
  }
  return context;
};

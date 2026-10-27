import React, { useState } from 'react';
import appIcon from '../assets/app-icon.png';
import { 
  Terminal, 
  Globe, 
  Database, 
  Smartphone, 
  Trash2, 
  Play, 
  Pause, 
  Puzzle, 
  Sun, 
  Moon,
  PanelLeftClose,
  PanelLeft,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { TabType, DeviceInfo, CustomPluginSchema } from '../types';
import { useTheme } from '../theme/ThemeContext';

interface SidebarProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  selectedCustomPluginId?: string;
  onSelectCustomPlugin: (id: string) => void;
  customPlugins: CustomPluginSchema[];
  devices: DeviceInfo[];
  activeDeviceId?: string;
  onSelectDevice: (id: string) => void;
  logsCount: number;
  networkCount: number;
  queriesCount: number;
  isPaused: boolean;
  onTogglePause: () => void;
  onClearCurrent: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  selectedCustomPluginId,
  onSelectCustomPlugin,
  customPlugins,
  devices,
  activeDeviceId,
  onSelectDevice,
  logsCount,
  networkCount,
  queriesCount,
  isPaused,
  onTogglePause,
  onClearCurrent,
}) => {
  const { isDark, toggleTheme } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('devtools_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('devtools_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  const [isCoreOpen, setIsCoreOpen] = useState<boolean>(() => {
    try {
      return localStorage.getItem('devtools_sidebar_core_open') !== 'false';
    } catch {
      return true;
    }
  });

  const [isCustomOpen, setIsCustomOpen] = useState<boolean>(() => {
    try {
      return localStorage.getItem('devtools_sidebar_custom_open') !== 'false';
    } catch {
      return true;
    }
  });

  const toggleCoreAccordion = () => {
    setIsCoreOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('devtools_sidebar_core_open', String(next));
      } catch {}
      return next;
    });
  };

  const toggleCustomAccordion = () => {
    setIsCustomOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('devtools_sidebar_custom_open', String(next));
      } catch {}
      return next;
    });
  };

  const activeDevice = devices.find((d) => d.id === activeDeviceId) || devices[0];

  return (
    <aside
      className={`bg-devSurface border-r border-devBorder flex flex-col h-full select-none transition-all duration-200 shrink-0 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* App Branding & Minimizer Header */}
      <div className={`h-14 border-b border-devBorder flex items-center ${isCollapsed ? 'px-2 justify-center' : 'px-3 justify-between'}`}>
        {!isCollapsed ? (
          <>
            <div className="flex items-center space-x-2.5 min-w-0">
              <img src={appIcon} alt="Logo" className="w-7 h-7 rounded-lg object-contain shadow-sm shrink-0" />
              <div className="truncate">
                <h1 className="font-bold text-sm tracking-tight text-devText leading-none truncate">Desktop DevTools</h1>
                <span className="text-[10px] text-devAccent font-semibold">by @archie-dev</span>
              </div>
            </div>

            <div className="flex items-center space-x-1 shrink-0">
              <button
                onClick={toggleTheme}
                title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                className="p-1.5 rounded-md border border-devBorder hover:bg-devCardHover text-devTextDim transition-colors"
              >
                {isDark ? <Sun className="w-3.5 h-3.5 text-amber-300" /> : <Moon className="w-3.5 h-3.5 text-sky-600" />}
              </button>

              <button
                onClick={toggleCollapse}
                title="Minimize Sidebar"
                className="p-1.5 rounded-md border border-devBorder hover:bg-devCardHover text-devTextMuted hover:text-devText transition-colors"
              >
                <PanelLeftClose className="w-3.5 h-3.5" />
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center space-y-1">
            <button
              onClick={toggleCollapse}
              title="Expand Sidebar"
              className="p-1.5 rounded-md border border-devBorder hover:bg-devCardHover text-devTextDim hover:text-devAccent transition-colors"
            >
              <PanelLeft className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Connected Device Selector / Indicator */}
      <div className={`border-b border-devBorder ${isCollapsed ? 'p-2 flex justify-center' : 'p-3'}`}>
        {!isCollapsed ? (
          <>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-devTextMuted mb-1.5 block">
              Connected Device
            </label>
            <div className="relative">
              <select
                value={activeDeviceId || ''}
                onChange={(e) => onSelectDevice(e.target.value)}
                className="w-full bg-devCard text-xs text-devText border border-devBorder rounded-md py-1.5 pl-8 pr-2 focus:outline-none focus:border-devAccent appearance-none font-medium truncate"
              >
                {devices.length === 0 ? (
                  <option value="">Waiting for React Native...</option>
                ) : (
                  devices.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.osVersion})
                    </option>
                  ))
                )}
              </select>
              <Smartphone className="w-3.5 h-3.5 text-devTextMuted absolute left-2.5 top-2.5 pointer-events-none" />
            </div>
          </>
        ) : (
          <div className="relative group flex items-center justify-center">
            <div
              className={`p-2 rounded-lg border border-devBorder flex items-center justify-center transition-colors cursor-pointer ${
                devices.length > 0 ? 'bg-devCard hover:bg-devCardHover text-emerald-400' : 'bg-devCard text-devTextMuted opacity-60'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              {devices.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </div>

            {/* Hover Tooltip Popup */}
            <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-devSurface border border-devBorder rounded-md text-xs shadow-xl whitespace-nowrap z-50 pointer-events-none hidden group-hover:block">
              <p className="font-semibold text-devText">
                {activeDevice ? activeDevice.name : 'Waiting for connection...'}
              </p>
              {activeDevice && (
                <p className="text-[10px] text-devTextMuted font-mono mt-0.5">
                  {activeDevice.address} • {activeDevice.platform}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Navigation Tabs */}
      <div className={`flex-1 overflow-y-auto ${isCollapsed ? 'p-2 space-y-2' : 'px-2 py-3 space-y-2'}`}>
        {/* Core Plugins Accordion Header */}
        {!isCollapsed && (
          <button
            type="button"
            onClick={toggleCoreAccordion}
            className="w-full flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-devTextMuted hover:text-devText px-2 py-1.5 rounded hover:bg-devCardHover/50 transition-colors group cursor-pointer"
          >
            <div className="flex items-center space-x-1.5">
              <span>Core Plugins</span>
              <span className="text-[9px] font-mono font-normal text-devTextMuted/70 bg-devCard border border-devBorder px-1 rounded">
                3
              </span>
            </div>
            {isCoreOpen ? (
              <ChevronDown className="w-3 h-3 text-devTextMuted group-hover:text-devText transition-transform" />
            ) : (
              <ChevronRight className="w-3 h-3 text-devTextMuted group-hover:text-devText transition-transform" />
            )}
          </button>
        )}

        {/* Collapsible Core Plugins List */}
        {(isCoreOpen || isCollapsed) && (
          <div className="space-y-1">
            {/* 1. Logs & Console */}
            <div className="relative group">
              <button
                onClick={() => onSelectTab('logs')}
                title={isCollapsed ? `Logs & Console (${logsCount})` : undefined}
                className={`w-full flex items-center rounded-md transition-colors ${
                  isCollapsed
                    ? 'p-2.5 justify-center relative'
                    : 'justify-between px-2.5 py-2 text-xs font-medium'
                } ${
                  currentTab === 'logs'
                    ? 'bg-devAccent/15 text-devAccent border border-devAccent/30 font-semibold'
                    : 'text-devText hover:bg-devCardHover'
                }`}
              >
                <div className="flex items-center space-x-2.5 truncate">
                  <Terminal className="w-4 h-4 text-emerald-500 shrink-0" />
                  {!isCollapsed && <span className="truncate">Logs & Console</span>}
                </div>

                {!isCollapsed && logsCount > 0 && (
                  <span className="bg-devCard text-devTextDim text-[10px] px-1.5 py-0.5 rounded-full font-mono border border-devBorder">
                    {logsCount}
                  </span>
                )}

                {isCollapsed && logsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-emerald-500 text-white font-mono text-[9px] px-1 rounded-full font-bold shadow-sm">
                    {logsCount > 99 ? '99+' : logsCount}
                  </span>
                )}
              </button>

              {isCollapsed && (
                <div className="absolute left-full ml-3 px-2.5 py-1 bg-devSurface border border-devBorder rounded text-xs text-devText shadow-xl whitespace-nowrap z-50 pointer-events-none hidden group-hover:flex items-center space-x-1.5">
                  <span className="font-medium">Logs & Console</span>
                  {logsCount > 0 && (
                    <span className="bg-emerald-500/20 text-emerald-400 font-mono text-[10px] px-1.5 py-0.2 rounded font-bold">
                      {logsCount}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* 2. Network & Mock */}
            <div className="relative group">
              <button
                onClick={() => onSelectTab('network')}
                title={isCollapsed ? `Network & Mock (${networkCount})` : undefined}
                className={`w-full flex items-center rounded-md transition-colors ${
                  isCollapsed
                    ? 'p-2.5 justify-center relative'
                    : 'justify-between px-2.5 py-2 text-xs font-medium'
                } ${
                  currentTab === 'network'
                    ? 'bg-devAccent/15 text-devAccent border border-devAccent/30 font-semibold'
                    : 'text-devText hover:bg-devCardHover'
                }`}
              >
                <div className="flex items-center space-x-2.5 truncate">
                  <Globe className="w-4 h-4 text-sky-500 shrink-0" />
                  {!isCollapsed && <span className="truncate">Network & Mock</span>}
                </div>

                {!isCollapsed && networkCount > 0 && (
                  <span className="bg-devCard text-devTextDim text-[10px] px-1.5 py-0.5 rounded-full font-mono border border-devBorder">
                    {networkCount}
                  </span>
                )}

                {isCollapsed && networkCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-sky-500 text-white font-mono text-[9px] px-1 rounded-full font-bold shadow-sm">
                    {networkCount > 99 ? '99+' : networkCount}
                  </span>
                )}
              </button>

              {isCollapsed && (
                <div className="absolute left-full ml-3 px-2.5 py-1 bg-devSurface border border-devBorder rounded text-xs text-devText shadow-xl whitespace-nowrap z-50 pointer-events-none hidden group-hover:flex items-center space-x-1.5">
                  <span className="font-medium">Network & Mock</span>
                  {networkCount > 0 && (
                    <span className="bg-sky-500/20 text-sky-400 font-mono text-[10px] px-1.5 py-0.2 rounded font-bold">
                      {networkCount}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* 3. TanStack Query */}
            <div className="relative group">
              <button
                onClick={() => onSelectTab('queries')}
                title={isCollapsed ? `TanStack Query (${queriesCount})` : undefined}
                className={`w-full flex items-center rounded-md transition-colors ${
                  isCollapsed
                    ? 'p-2.5 justify-center relative'
                    : 'justify-between px-2.5 py-2 text-xs font-medium'
                } ${
                  currentTab === 'queries'
                    ? 'bg-devAccent/15 text-devAccent border border-devAccent/30 font-semibold'
                    : 'text-devText hover:bg-devCardHover'
                }`}
              >
                <div className="flex items-center space-x-2.5 truncate">
                  <Database className="w-4 h-4 text-amber-500 shrink-0" />
                  {!isCollapsed && <span className="truncate">TanStack Query</span>}
                </div>

                {!isCollapsed && queriesCount > 0 && (
                  <span className="bg-devCard text-devTextDim text-[10px] px-1.5 py-0.5 rounded-full font-mono border border-devBorder">
                    {queriesCount}
                  </span>
                )}

                {isCollapsed && queriesCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-amber-500 text-white font-mono text-[9px] px-1 rounded-full font-bold shadow-sm">
                    {queriesCount > 99 ? '99+' : queriesCount}
                  </span>
                )}
              </button>

              {isCollapsed && (
                <div className="absolute left-full ml-3 px-2.5 py-1 bg-devSurface border border-devBorder rounded text-xs text-devText shadow-xl whitespace-nowrap z-50 pointer-events-none hidden group-hover:flex items-center space-x-1.5">
                  <span className="font-medium">TanStack Query</span>
                  {queriesCount > 0 && (
                    <span className="bg-amber-500/20 text-amber-400 font-mono text-[10px] px-1.5 py-0.2 rounded font-bold">
                      {queriesCount}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Custom Plugins Accordion */}
        {customPlugins.length > 0 && (
          <div className="pt-2">
            {!isCollapsed && (
              <button
                type="button"
                onClick={toggleCustomAccordion}
                className="w-full flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-devTextMuted hover:text-devText px-2 py-1.5 rounded hover:bg-devCardHover/50 transition-colors group cursor-pointer"
              >
                <div className="flex items-center space-x-1.5">
                  <span>Custom Plugins</span>
                  <span className="text-[9px] font-mono font-normal text-devTextMuted/70 bg-devCard border border-devBorder px-1 rounded">
                    {customPlugins.length}
                  </span>
                </div>
                {isCustomOpen ? (
                  <ChevronDown className="w-3 h-3 text-devTextMuted group-hover:text-devText transition-transform" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-devTextMuted group-hover:text-devText transition-transform" />
                )}
              </button>
            )}

            {(isCustomOpen || isCollapsed) && (
              <div className="space-y-1 mt-1">
                {customPlugins.map((plugin) => (
                  <div key={plugin.id} className="relative group">
                    <button
                      onClick={() => {
                        onSelectTab('custom');
                        onSelectCustomPlugin(plugin.id);
                      }}
                      title={isCollapsed ? plugin.title : undefined}
                      className={`w-full flex items-center rounded-md transition-colors ${
                        isCollapsed
                          ? 'p-2.5 justify-center'
                          : 'justify-between px-2.5 py-2 text-xs font-medium'
                      } ${
                        currentTab === 'custom' && selectedCustomPluginId === plugin.id
                          ? 'bg-devAccent/15 text-devAccent border border-devAccent/30 font-semibold'
                          : 'text-devText hover:bg-devCardHover'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 truncate">
                        <Puzzle className="w-4 h-4 text-fuchsia-500 shrink-0" />
                        {!isCollapsed && <span className="truncate">{plugin.title}</span>}
                      </div>
                    </button>

                    {isCollapsed && (
                      <div className="absolute left-full ml-3 px-2.5 py-1 bg-devSurface border border-devBorder rounded text-xs text-devText shadow-xl whitespace-nowrap z-50 pointer-events-none hidden group-hover:flex items-center">
                        <span className="font-medium">{plugin.title}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Action Footer Controls */}
      <div className={`p-2.5 border-t border-devBorder bg-devSurface/50 flex ${isCollapsed ? 'flex-col items-center space-y-2' : 'items-center space-x-2'}`}>
        {isCollapsed && (
          <button
            onClick={toggleTheme}
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            className="p-2 rounded-md border border-devBorder hover:bg-devCardHover text-devTextDim transition-colors"
          >
            {isDark ? <Sun className="w-3.5 h-3.5 text-amber-300" /> : <Moon className="w-3.5 h-3.5 text-sky-600" />}
          </button>
        )}

        <button
          onClick={onTogglePause}
          title={isPaused ? "Resume Stream" : "Pause Stream"}
          className={`flex items-center justify-center rounded border transition-colors ${
            isCollapsed
              ? 'p-2'
              : 'flex-1 py-1.5 px-2 space-x-1.5 text-xs font-medium'
          } ${
            isPaused
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
              : 'bg-devCard border-devBorder text-devText hover:bg-devCardHover'
          }`}
        >
          {isPaused ? <Play className="w-3.5 h-3.5 text-amber-500" /> : <Pause className="w-3.5 h-3.5" />}
          {!isCollapsed && <span>{isPaused ? 'Resume' : 'Pause'}</span>}
        </button>

        <button
          onClick={onClearCurrent}
          title="Clear current tab entries"
          className={`rounded border border-devBorder bg-devCard text-devTextMuted hover:text-rose-500 hover:border-rose-500/30 transition-colors ${
            isCollapsed ? 'p-2' : 'p-1.5'
          }`}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};

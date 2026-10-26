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
  Moon
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

  return (
    <aside className="w-64 bg-devSurface border-r border-devBorder flex flex-col h-full select-none transition-colors duration-150">
      {/* App Branding & Theme Toggle Header */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-devBorder">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <span className="text-white font-black text-xs">⚛</span>
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-tight text-devText leading-none">Unified DevTools</h1>
            <span className="text-[10px] text-devAccent font-semibold">by @archie-dev</span>
          </div>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          className="p-1.5 rounded-md border border-devBorder hover:bg-devCardHover text-devTextDim transition-colors"
        >
          {isDark ? <Sun className="w-3.5 h-3.5 text-amber-300" /> : <Moon className="w-3.5 h-3.5 text-sky-600" />}
        </button>
      </div>

      {/* Device Selector */}
      <div className="p-3 border-b border-devBorder">
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
      </div>

      {/* Main Core Plugins List */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-devTextMuted px-2 py-1">
          Core Plugins
        </div>

        <button
          onClick={() => onSelectTab('logs')}
          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-md text-xs font-medium transition-colors ${
            currentTab === 'logs'
              ? 'bg-devAccent/15 text-devAccent border border-devAccent/30 font-semibold'
              : 'text-devText hover:bg-devCardHover'
          }`}
        >
          <div className="flex items-center space-x-2.5 truncate">
            <Terminal className="w-4 h-4 text-emerald-500" />
            <span className="truncate">Logs & Console</span>
          </div>
          {logsCount > 0 && (
            <span className="bg-devCard text-devTextDim text-[10px] px-1.5 py-0.5 rounded-full font-mono border border-devBorder">
              {logsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => onSelectTab('network')}
          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-md text-xs font-medium transition-colors ${
            currentTab === 'network'
              ? 'bg-devAccent/15 text-devAccent border border-devAccent/30 font-semibold'
              : 'text-devText hover:bg-devCardHover'
          }`}
        >
          <div className="flex items-center space-x-2.5 truncate">
            <Globe className="w-4 h-4 text-sky-500" />
            <span className="truncate">Network & Mock</span>
          </div>
          {networkCount > 0 && (
            <span className="bg-devCard text-devTextDim text-[10px] px-1.5 py-0.5 rounded-full font-mono border border-devBorder">
              {networkCount}
            </span>
          )}
        </button>

        <button
          onClick={() => onSelectTab('queries')}
          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-md text-xs font-medium transition-colors ${
            currentTab === 'queries'
              ? 'bg-devAccent/15 text-devAccent border border-devAccent/30 font-semibold'
              : 'text-devText hover:bg-devCardHover'
          }`}
        >
          <div className="flex items-center space-x-2.5 truncate">
            <Database className="w-4 h-4 text-amber-500" />
            <span className="truncate">TanStack Query</span>
          </div>
          {queriesCount > 0 && (
            <span className="bg-devCard text-devTextDim text-[10px] px-1.5 py-0.5 rounded-full font-mono border border-devBorder">
              {queriesCount}
            </span>
          )}
        </button>

        {/* Custom Dynamic Schema Plugins */}
        {customPlugins.length > 0 && (
          <>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-devTextMuted px-2 pt-4 pb-1">
              Custom Plugins
            </div>
            {customPlugins.map((plugin) => (
              <button
                key={plugin.id}
                onClick={() => {
                  onSelectTab('custom');
                  onSelectCustomPlugin(plugin.id);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-md text-xs font-medium transition-colors ${
                  currentTab === 'custom' && selectedCustomPluginId === plugin.id
                    ? 'bg-devAccent/15 text-devAccent border border-devAccent/30 font-semibold'
                    : 'text-devText hover:bg-devCardHover'
                }`}
              >
                <div className="flex items-center space-x-2.5 truncate">
                  <Puzzle className="w-4 h-4 text-fuchsia-500" />
                  <span className="truncate">{plugin.title}</span>
                </div>
              </button>
            ))}
          </>
        )}
      </div>

      {/* Quick Action Footer Controls */}
      <div className="p-3 border-t border-devBorder bg-devSurface/50 flex items-center space-x-2">
        <button
          onClick={onTogglePause}
          title={isPaused ? "Resume Stream" : "Pause Stream"}
          className={`flex-1 flex items-center justify-center space-x-1.5 py-1.5 px-2 rounded border text-xs font-medium transition-colors ${
            isPaused
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
              : 'bg-devCard border-devBorder text-devText hover:bg-devCardHover'
          }`}
        >
          {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          <span>{isPaused ? 'Resume' : 'Pause'}</span>
        </button>

        <button
          onClick={onClearCurrent}
          title="Clear current tab entries"
          className="p-1.5 rounded border border-devBorder bg-devCard text-devTextMuted hover:text-rose-500 hover:border-rose-500/30 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};

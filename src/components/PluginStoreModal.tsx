import React, { useState } from 'react';
import { 
  X, 
  Download, 
  ExternalLink, 
  Check, 
  AlertCircle, 
  Boxes, 
  Trash2, 
  Sparkles,
  Database,
  Layers,
  Flag,
  Code2
} from 'lucide-react';
import { CustomPluginSchema } from '../types';

export const FEATURED_PLUGINS: CustomPluginSchema[] = [
  {
    id: 'mmkv',
    title: 'MMKV Storage',
    description: 'Inspect, query, and modify key-value pairs stored in react-native-mmkv in real time.',
    icon: 'database',
    version: '1.0.0',
    author: 'mrousavy / community',
    repository: 'https://github.com/mrousavy/react-native-mmkv',
    columns: [
      { key: 'key', label: 'Key', type: 'text' },
      { key: 'type', label: 'Type', type: 'badge' },
      { key: 'value', label: 'Value', type: 'json' },
      { key: 'size', label: 'Size', type: 'text' },
      { key: 'timestamp', label: 'Last Modified', type: 'timestamp' },
    ],
    actions: [
      { id: 'refresh', label: 'Reload Keys' },
      { id: 'clear_all', label: 'Wipe Storage' },
    ],
  },
  {
    id: 'async_storage',
    title: 'AsyncStorage',
    description: 'Explore all serialized keys, string payloads, and storage entries in AsyncStorage.',
    icon: 'layers',
    version: '1.0.0',
    author: 'react-native-async-storage',
    repository: 'https://github.com/react-native-async-storage/async-storage',
    columns: [
      { key: 'key', label: 'Storage Key', type: 'text' },
      { key: 'value', label: 'Value', type: 'json' },
      { key: 'bytes', label: 'Bytes', type: 'number' },
      { key: 'timestamp', label: 'Timestamp', type: 'timestamp' },
    ],
    actions: [
      { id: 'refresh', label: 'Reload Keys' },
      { id: 'clear', label: 'Clear All' },
    ],
  },
  {
    id: 'feature_flags',
    title: 'Feature Flags',
    description: 'Real-time toggle control and live state inspection for remote feature gates and A/B rollout variants.',
    icon: 'flag',
    version: '1.1.0',
    author: 'unified-devtools',
    repository: 'https://github.com/unified-devtools/react-native-core',
    columns: [
      { key: 'flag', label: 'Flag Key', type: 'text' },
      { key: 'enabled', label: 'Status', type: 'badge' },
      { key: 'description', label: 'Description', type: 'text' },
      { key: 'rollout', label: 'Rollout %', type: 'number' },
    ],
    actions: [
      { id: 'sync', label: 'Sync with Remote' },
      { id: 'reset', label: 'Reset to Defaults' },
    ],
  },
];

interface PluginStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  installedPlugins: CustomPluginSchema[];
  onInstallPlugin: (plugin: CustomPluginSchema) => void;
  onUninstallPlugin: (pluginId: string) => void;
}

export const PluginStoreModal: React.FC<PluginStoreModalProps> = ({
  isOpen,
  onClose,
  installedPlugins,
  onInstallPlugin,
  onUninstallPlugin,
}) => {
  const [activeTab, setActiveTab] = useState<'featured' | 'github' | 'installed'>('featured');
  const [githubUrl, setGithubUrl] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [previewPlugin, setPreviewPlugin] = useState<CustomPluginSchema | null>(null);

  if (!isOpen) return null;

  const isInstalled = (id: string) => installedPlugins.some((p) => p.id === id);

  const parseGithubCandidateUrls = (input: string): string[] => {
    const trimmed = input.trim();
    if (trimmed.startsWith('https://raw.githubusercontent.com/') && trimmed.endsWith('.json')) {
      return [trimmed];
    }

    let owner = '';
    let repo = '';

    const ghMatch = trimmed.match(/github\.com\/([^/]+)\/([^/]+?)(?:\.git|\/)?$/i);
    if (ghMatch) {
      owner = ghMatch[1];
      repo = ghMatch[2];
    } else if (/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(trimmed)) {
      const parts = trimmed.split('/');
      owner = parts[0];
      repo = parts[1];
    }

    if (owner && repo) {
      return [
        `https://raw.githubusercontent.com/${owner}/${repo}/main/devtools-plugin.json`,
        `https://raw.githubusercontent.com/${owner}/${repo}/main/plugin.json`,
        `https://raw.githubusercontent.com/${owner}/${repo}/master/devtools-plugin.json`,
        `https://raw.githubusercontent.com/${owner}/${repo}/master/plugin.json`,
      ];
    }

    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return [trimmed];
    }

    return [];
  };

  const handleFetchFromGithub = async () => {
    if (!githubUrl.trim()) return;

    setIsFetching(true);
    setFetchError(null);
    setPreviewPlugin(null);

    const candidates = parseGithubCandidateUrls(githubUrl);
    if (candidates.length === 0) {
      setFetchError('Please enter a valid GitHub repository URL (e.g. https://github.com/owner/repo) or owner/repo format.');
      setIsFetching(false);
      return;
    }

    let manifest: any = null;

    for (const url of candidates) {
      try {
        const res = await fetch(url);
        if (res.ok) {
          manifest = await res.json();
          break;
        }
      } catch {}
    }

    if (!manifest) {
      setFetchError('Could not find devtools-plugin.json or plugin.json in repository (main or master branches).');
      setIsFetching(false);
      return;
    }

    if (!manifest.id && !manifest.title) {
      setFetchError('Invalid plugin schema: manifest must specify at least "title" or "id".');
      setIsFetching(false);
      return;
    }

    const plugin: CustomPluginSchema = {
      id: manifest.id || manifest.title.toLowerCase().replace(/[^a-z0-9]/g, '_'),
      title: manifest.title || manifest.id,
      description: manifest.description || 'Custom plugin downloaded from GitHub.',
      version: manifest.version || '1.0.0',
      author: manifest.author || 'GitHub Contributor',
      repository: githubUrl,
      icon: manifest.icon || 'puzzle',
      columns: Array.isArray(manifest.columns) ? manifest.columns : [
        { key: 'key', label: 'Key', type: 'text' },
        { key: 'value', label: 'Value', type: 'json' },
        { key: 'timestamp', label: 'Timestamp', type: 'timestamp' },
      ],
      actions: Array.isArray(manifest.actions) ? manifest.actions : [
        { id: 'refresh', label: 'Reload' },
      ],
      isInstalled: true,
    };

    setPreviewPlugin(plugin);
    setIsFetching(false);
  };

  const getPluginIcon = (iconName?: string) => {
    switch (iconName) {
      case 'database':
        return <Database className="w-5 h-5 text-amber-500" />;
      case 'layers':
        return <Layers className="w-5 h-5 text-sky-500" />;
      case 'flag':
        return <Flag className="w-5 h-5 text-fuchsia-500" />;
      default:
        return <Boxes className="w-5 h-5 text-devAccent" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 select-none">
      <div className="bg-devSurface border border-devBorder w-full max-w-2xl rounded-xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-devBorder flex items-center justify-between shrink-0 bg-devSurface/80">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-devAccent/15 border border-devAccent/30 text-devAccent">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-devText">Plugin Store & Manager</h2>
              <p className="text-xs text-devTextMuted">Install and manage custom devtools plugins from GitHub or community presets</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border border-devBorder hover:bg-devCardHover text-devTextMuted hover:text-devText transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-5 border-b border-devBorder flex items-center space-x-4 bg-devSurface">
          <button
            onClick={() => setActiveTab('featured')}
            className={`py-2.5 text-xs font-semibold border-b-2 flex items-center space-x-1.5 transition-colors ${
              activeTab === 'featured'
                ? 'border-devAccent text-devAccent'
                : 'border-transparent text-devTextMuted hover:text-devText'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Featured Plugins</span>
          </button>

          <button
            onClick={() => setActiveTab('github')}
            className={`py-2.5 text-xs font-semibold border-b-2 flex items-center space-x-1.5 transition-colors ${
              activeTab === 'github'
                ? 'border-devAccent text-devAccent'
                : 'border-transparent text-devTextMuted hover:text-devText'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Download from GitHub</span>
          </button>

          <button
            onClick={() => setActiveTab('installed')}
            className={`py-2.5 text-xs font-semibold border-b-2 flex items-center space-x-1.5 transition-colors ${
              activeTab === 'installed'
                ? 'border-devAccent text-devAccent'
                : 'border-transparent text-devTextMuted hover:text-devText'
            }`}
          >
            <Check className="w-3.5 h-3.5" />
            <span>Installed ({installedPlugins.length})</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 bg-devBg/50">
          
          {/* TAB 1: Featured Community Plugins */}
          {activeTab === 'featured' && (
            <div className="space-y-3">
              <div className="text-xs text-devTextMuted mb-2">
                Curated community plugins ready to install with zero setup:
              </div>

              {FEATURED_PLUGINS.map((plugin) => {
                const installed = isInstalled(plugin.id);
                return (
                  <div
                    key={plugin.id}
                    className="p-4 rounded-xl border border-devBorder bg-devCard hover:border-devBorder/80 transition-all flex items-start justify-between space-x-4"
                  >
                    <div className="flex items-start space-x-3.5">
                      <div className="p-2.5 rounded-lg bg-devSurface border border-devBorder shrink-0">
                        {getPluginIcon(plugin.icon)}
                      </div>

                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="text-xs font-bold text-devText">{plugin.title}</h3>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-devSurface border border-devBorder text-devTextMuted">
                            v{plugin.version}
                          </span>
                        </div>
                        <p className="text-xs text-devTextDim mt-1 leading-relaxed">{plugin.description}</p>
                        
                        <div className="flex items-center space-x-3 mt-2.5 text-[11px] text-devTextMuted">
                          <span>Columns: <strong className="text-devText">{plugin.columns.length}</strong></span>
                          <span>Actions: <strong className="text-devText">{plugin.actions.length}</strong></span>
                          {plugin.repository && (
                            <a
                              href={plugin.repository}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center space-x-1 text-devAccent hover:underline"
                            >
                              <span>GitHub</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 pt-1">
                      {installed ? (
                        <button
                          onClick={() => onUninstallPlugin(plugin.id)}
                          className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-devBorder bg-devSurface hover:bg-rose-500/10 hover:border-rose-500/30 text-devTextMuted hover:text-rose-400 text-xs font-medium transition-colors"
                        >
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Installed</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => onInstallPlugin(plugin)}
                          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-devAccent hover:bg-devAccent/90 text-white text-xs font-semibold shadow-xs transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Install</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: Download from GitHub */}
          {activeTab === 'github' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-devText block mb-1.5">
                  GitHub Repository URL or owner/repo
                </label>
                <div className="flex items-center space-x-2">
                  <div className="relative flex-1">
                    <Code2 className="w-4 h-4 text-devTextMuted absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="e.g. https://github.com/mrousavy/react-native-mmkv or user/repo"
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleFetchFromGithub()}
                      className="w-full bg-devCard border border-devBorder rounded-lg py-2 pl-9 pr-3 text-xs text-devText placeholder-devTextMuted focus:outline-none focus:border-devAccent font-mono"
                    />
                  </div>

                  <button
                    onClick={handleFetchFromGithub}
                    disabled={isFetching || !githubUrl.trim()}
                    className="px-4 py-2 rounded-lg bg-devAccent hover:bg-devAccent/90 disabled:opacity-50 text-white text-xs font-semibold transition-colors shrink-0 flex items-center space-x-1.5"
                  >
                    {isFetching ? (
                      <span>Fetching...</span>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        <span>Fetch Plugin</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-[11px] text-devTextMuted mt-1.5">
                  DevTools checks the repo for <code className="font-mono text-devAccent">devtools-plugin.json</code> or <code className="font-mono text-devAccent">plugin.json</code> on main or master branches.
                </p>
              </div>

              {/* Error Alert */}
              {fetchError && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{fetchError}</span>
                </div>
              )}

              {/* Preview Card */}
              {previewPlugin && (
                <div className="p-4 rounded-xl border border-devAccent/40 bg-devCard shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-2 rounded bg-devSurface border border-devBorder">
                        <Boxes className="w-4 h-4 text-devAccent" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-devText">{previewPlugin.title}</h4>
                        <span className="text-[10px] text-devTextMuted font-mono">id: {previewPlugin.id} • v{previewPlugin.version}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        onInstallPlugin(previewPlugin);
                        setPreviewPlugin(null);
                        setGithubUrl('');
                        setActiveTab('installed');
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Install Plugin</span>
                    </button>
                  </div>

                  <p className="text-xs text-devTextDim">{previewPlugin.description}</p>

                  <div className="pt-2 border-t border-devBorder text-[11px] space-y-1">
                    <div className="text-devTextMuted font-semibold uppercase text-[10px]">Columns ({previewPlugin.columns.length}):</div>
                    <div className="flex flex-wrap gap-1">
                      {previewPlugin.columns.map((c) => (
                        <span key={c.key} className="bg-devSurface border border-devBorder px-1.5 py-0.5 rounded text-devText font-mono text-[10px]">
                          {c.label} ({c.type})
                        </span>
                      ))}
                    </div>
                  </div>

                  {previewPlugin.actions.length > 0 && (
                    <div className="pt-1 text-[11px] space-y-1">
                      <div className="text-devTextMuted font-semibold uppercase text-[10px]">Actions ({previewPlugin.actions.length}):</div>
                      <div className="flex flex-wrap gap-1">
                        {previewPlugin.actions.map((a) => (
                          <span key={a.id} className="bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-400 px-1.5 py-0.5 rounded font-mono text-[10px]">
                            {a.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Installed Plugins */}
          {activeTab === 'installed' && (
            <div className="space-y-3">
              {installedPlugins.length === 0 ? (
                <div className="p-8 text-center text-devTextMuted text-xs">
                  <Boxes className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="font-semibold text-devText">No plugins installed yet</p>
                  <p className="text-[11px] mt-1">Select from Featured Plugins or paste a GitHub repo URL to install.</p>
                </div>
              ) : (
                installedPlugins.map((plugin) => (
                  <div
                    key={plugin.id}
                    className="p-3.5 rounded-xl border border-devBorder bg-devCard flex items-center justify-between space-x-3"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded bg-devSurface border border-devBorder">
                        {getPluginIcon(plugin.icon)}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="text-xs font-bold text-devText">{plugin.title}</h4>
                          <span className="text-[10px] font-mono text-devTextMuted">v{plugin.version || '1.0.0'}</span>
                        </div>
                        <p className="text-[11px] text-devTextMuted line-clamp-1">{plugin.description}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => onUninstallPlugin(plugin.id)}
                      title="Uninstall Plugin"
                      className="p-2 rounded-lg border border-devBorder hover:bg-rose-500/10 hover:border-rose-500/30 text-devTextMuted hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-devBorder bg-devSurface/80 flex items-center justify-between text-xs text-devTextMuted">
          <span>Plugins interact with React Native via WebSocket custom events</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-devBorder bg-devCard hover:bg-devCardHover text-devText font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

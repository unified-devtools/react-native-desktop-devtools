import React, { useState, useEffect } from 'react';
import { 
  X, 
  Download, 
  ExternalLink, 
  Check, 
  AlertCircle, 
  Boxes, 
  Trash2, 
  Sparkles, 
  Code2,
  RefreshCw,
  ArrowUpCircle
} from 'lucide-react';
import { CustomPluginSchema } from '../types';
import { PluginIcon } from './PluginIcon';

export const OFFICIAL_REGISTRY_URL = 'https://raw.githubusercontent.com/unified-devtools/plugins/main/registry.json';

export interface RegistryPluginItem {
  id: string;
  title: string;
  version: string;
  description: string;
  author: string;
  icon?: string;
  manifestUrl: string;
  repository?: string;
}

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
  const [activeTab, setActiveTab] = useState<'registry' | 'github' | 'installed'>('registry');
  
  // Registry state fetched from GitHub
  const [registryPlugins, setRegistryPlugins] = useState<RegistryPluginItem[]>([]);
  const [isLoadingRegistry, setIsLoadingRegistry] = useState(false);
  const [registryError, setRegistryError] = useState<string | null>(null);

  // Installing state per plugin ID
  const [installingId, setInstallingId] = useState<string | null>(null);

  // GitHub Custom URL input state
  const [githubUrl, setGithubUrl] = useState('');
  const [isFetchingCustom, setIsFetchingCustom] = useState(false);
  const [customFetchError, setCustomFetchError] = useState<string | null>(null);
  const [previewPlugin, setPreviewPlugin] = useState<CustomPluginSchema | null>(null);

  // Fetch official plugin catalog from GitHub
  const fetchRegistry = async () => {
    setIsLoadingRegistry(true);
    setRegistryError(null);
    try {
      const res = await fetch(`${OFFICIAL_REGISTRY_URL}?t=${Date.now()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (Array.isArray(data.plugins)) {
        setRegistryPlugins(data.plugins);
      }
    } catch (err: any) {
      setRegistryError('Failed to fetch official plugins list from GitHub. Check your internet connection.');
    } finally {
      setIsLoadingRegistry(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchRegistry();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isInstalled = (id: string) => installedPlugins.some((p) => p.id === id);

  const getInstalledVersion = (id: string): string | undefined => {
    return installedPlugins.find((p) => p.id === id)?.version;
  };

  const hasUpdate = (reg: RegistryPluginItem): boolean => {
    const installedVer = getInstalledVersion(reg.id);
    if (!installedVer) return false;
    return installedVer !== reg.version;
  };

  // Download manifest from GitHub and install
  const handleDownloadAndInstallFromRegistry = async (reg: RegistryPluginItem) => {
    setInstallingId(reg.id);
    try {
      const res = await fetch(`${reg.manifestUrl}?t=${Date.now()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const manifest = await res.json();

      const plugin: CustomPluginSchema = {
        id: manifest.id || reg.id,
        title: manifest.title || reg.title,
        description: manifest.description || reg.description,
        version: manifest.version || reg.version,
        author: manifest.author || reg.author,
        repository: manifest.repository || reg.repository,
        icon: manifest.icon || reg.icon || 'puzzle',
        columns: Array.isArray(manifest.columns) ? manifest.columns : [],
        actions: Array.isArray(manifest.actions) ? manifest.actions : [],
        isInstalled: true,
      };

      onInstallPlugin(plugin);
    } catch (err: any) {
      alert(`Failed to download ${reg.title} plugin from GitHub: ${err.message}`);
    } finally {
      setInstallingId(null);
    }
  };

  // Parse GitHub input URLs for custom plugins
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

  // Fetch from custom GitHub repo
  const handleFetchFromCustomGithub = async () => {
    if (!githubUrl.trim()) return;

    setIsFetchingCustom(true);
    setCustomFetchError(null);
    setPreviewPlugin(null);

    const candidates = parseGithubCandidateUrls(githubUrl);
    if (candidates.length === 0) {
      setCustomFetchError('Please enter a valid GitHub repository URL (e.g. https://github.com/owner/repo) or owner/repo format.');
      setIsFetchingCustom(false);
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
      setCustomFetchError('Could not find devtools-plugin.json or plugin.json in repository (main or master branches).');
      setIsFetchingCustom(false);
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
      columns: Array.isArray(manifest.columns) ? manifest.columns : [],
      actions: Array.isArray(manifest.actions) ? manifest.actions : [],
      isInstalled: true,
    };

    setPreviewPlugin(plugin);
    setIsFetchingCustom(false);
  };

  const getPluginIcon = (iconName?: string, id?: string) => {
    return <PluginIcon icon={iconName} id={id} className="w-5 h-5 shrink-0" />;
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
              <h2 className="text-sm font-bold text-devText">Desktop Plugins Store</h2>
              <p className="text-xs text-devTextMuted">Download and update React Native plugins live from GitHub (<span className="font-mono text-devAccent">unified-devtools/plugins</span>)</p>
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
            onClick={() => setActiveTab('registry')}
            className={`py-2.5 text-xs font-semibold border-b-2 flex items-center space-x-1.5 transition-colors ${
              activeTab === 'registry'
                ? 'border-devAccent text-devAccent'
                : 'border-transparent text-devTextMuted hover:text-devText'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>GitHub Registry ({registryPlugins.length})</span>
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
            <span>Custom GitHub Repo</span>
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
          
          {/* TAB 1: Official GitHub Registry */}
          {activeTab === 'registry' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-devTextMuted mb-2">
                <span>Plugins published in <strong className="text-devText">unified-devtools/plugins</strong>:</span>
                <button
                  onClick={fetchRegistry}
                  disabled={isLoadingRegistry}
                  className="flex items-center space-x-1 text-devAccent hover:underline text-[11px]"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingRegistry ? 'animate-spin' : ''}`} />
                  <span>Check Updates</span>
                </button>
              </div>

              {isLoadingRegistry && registryPlugins.length === 0 && (
                <div className="p-8 text-center text-xs text-devTextMuted">
                  <RefreshCw className="w-5 h-5 mx-auto mb-2 animate-spin text-devAccent" />
                  <p>Connecting to GitHub plugin registry...</p>
                </div>
              )}

              {registryError && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{registryError}</span>
                </div>
              )}

              {registryPlugins.map((reg) => {
                const installed = isInstalled(reg.id);
                const updateNeeded = hasUpdate(reg);
                const isInstalling = installingId === reg.id;

                return (
                  <div
                    key={reg.id}
                    className="p-4 rounded-xl border border-devBorder bg-devCard hover:border-devBorder/80 transition-all flex items-start justify-between space-x-4"
                  >
                    <div className="flex items-start space-x-3.5">
                      <div className="p-2.5 rounded-lg bg-devSurface border border-devBorder shrink-0">
                        {getPluginIcon(reg.icon, reg.id)}
                      </div>

                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="text-xs font-bold text-devText">{reg.title}</h3>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-devSurface border border-devBorder text-devTextMuted">
                            v{reg.version}
                          </span>
                          {updateNeeded && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                              Update Available
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-devTextDim mt-1 leading-relaxed">{reg.description}</p>
                        
                        <div className="flex items-center space-x-3 mt-2 text-[11px] text-devTextMuted">
                          <span>Author: <strong className="text-devText">{reg.author}</strong></span>
                          {reg.repository && (
                            <a
                              href={reg.repository}
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
                      {isInstalling ? (
                        <button
                          disabled
                          className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-devCard border border-devBorder text-devTextMuted text-xs font-medium"
                        >
                          <RefreshCw className="w-3 h-3 animate-spin text-devAccent" />
                          <span>Downloading...</span>
                        </button>
                      ) : updateNeeded ? (
                        <button
                          onClick={() => handleDownloadAndInstallFromRegistry(reg)}
                          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-xs transition-colors"
                        >
                          <ArrowUpCircle className="w-3.5 h-3.5" />
                          <span>Update</span>
                        </button>
                      ) : installed ? (
                        <button
                          onClick={() => onUninstallPlugin(reg.id)}
                          className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-devBorder bg-devSurface hover:bg-rose-500/10 hover:border-rose-500/30 text-devTextMuted hover:text-rose-400 text-xs font-medium transition-colors"
                        >
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Installed</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleDownloadAndInstallFromRegistry(reg)}
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

          {/* TAB 2: Download from Custom GitHub Repo */}
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
                      onKeyDown={(e) => e.key === 'Enter' && handleFetchFromCustomGithub()}
                      className="w-full bg-devCard border border-devBorder rounded-lg py-2 pl-9 pr-3 text-xs text-devText placeholder-devTextMuted focus:outline-none focus:border-devAccent font-mono"
                    />
                  </div>

                  <button
                    onClick={handleFetchFromCustomGithub}
                    disabled={isFetchingCustom || !githubUrl.trim()}
                    className="px-4 py-2 rounded-lg bg-devAccent hover:bg-devAccent/90 disabled:opacity-50 text-white text-xs font-semibold transition-colors shrink-0 flex items-center space-x-1.5"
                  >
                    {isFetchingCustom ? (
                      <span>Fetching...</span>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        <span>Fetch</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-[11px] text-devTextMuted mt-1.5">
                  Checks repository for <code className="font-mono text-devAccent">devtools-plugin.json</code> or <code className="font-mono text-devAccent">plugin.json</code> on main or master.
                </p>
              </div>

              {customFetchError && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{customFetchError}</span>
                </div>
              )}

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
                  <p className="text-[11px] mt-1">Click the "GitHub Registry" tab above to install MMKV or other community plugins.</p>
                </div>
              ) : (
                installedPlugins.map((plugin) => (
                  <div
                    key={plugin.id}
                    className="p-3.5 rounded-xl border border-devBorder bg-devCard flex items-center justify-between space-x-3"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded bg-devSurface border border-devBorder">
                        {getPluginIcon(plugin.icon, plugin.id)}
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

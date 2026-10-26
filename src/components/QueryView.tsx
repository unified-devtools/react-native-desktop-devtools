import React, { useState, useMemo } from 'react';
import { QueryEntry } from '../types';
import { 
  Search, 
  Database, 
  RefreshCw, 
  Zap, 
  Trash2, 
  Check, 
  Copy, 
  ListTree, 
  Code2, 
  RotateCcw, 
  AlertCircle,
  Layers,
  Activity,
  SlidersHorizontal
} from 'lucide-react';
import { JsonTree } from './JsonTree';

interface QueryViewProps {
  queries: QueryEntry[];
  onRefetchQuery: (queryKey: string) => void;
  onInvalidateQuery: (queryKey: string) => void;
  onResetQuery: (queryKey: string) => void;
  onRemoveQuery?: (queryKey: string) => void;
  onTriggerLoading?: (queryKey: string) => void;
  onTriggerError?: (queryKey: string) => void;
  onRefetchAll?: () => void;
  onClearAll?: () => void;
}

function formatTimeAgo(timestamp?: number): string {
  if (!timestamp) return 'never';
  const diff = Date.now() - timestamp;
  if (diff < 1000) return 'just now';
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  return `${hours}h ago`;
}

function formatQueryKey(keyStr: string): string {
  try {
    const parsed = JSON.parse(keyStr);
    if (Array.isArray(parsed)) {
      return `[${parsed.map((item) => (typeof item === 'object' ? JSON.stringify(item) : String(item))).join(', ')}]`;
    }
  } catch {}
  return keyStr;
}

export const QueryView: React.FC<QueryViewProps> = ({
  queries,
  onRefetchQuery,
  onInvalidateQuery,
  onResetQuery,
  onRemoveQuery,
  onTriggerLoading,
  onTriggerError,
  onRefetchAll,
  onClearAll,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'status' | 'key' | 'time'>('status');
  const [activeTab, setActiveTab] = useState<'data' | 'state' | 'options'>('data');
  const [viewMode, setViewMode] = useState<'tree' | 'raw'>('tree');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const filteredQueries = useMemo(() => {
    return queries.filter((q) => {
      if (!searchQuery.trim()) return true;
      const qk = formatQueryKey(q.key).toLowerCase();
      return qk.includes(searchQuery.toLowerCase());
    });
  }, [queries, searchQuery]);

  const sortedQueries = useMemo(() => {
    return [...filteredQueries].sort((a, b) => {
      if (sortBy === 'status') {
        const order: Record<string, number> = {
          error: 0,
          fetching: 1,
          paused: 2,
          stale: 3,
          fresh: 4,
          inactive: 5,
        };
        const orderA = order[a.status] ?? 99;
        const orderB = order[b.status] ?? 99;
        return orderA - orderB;
      }
      if (sortBy === 'key') {
        return a.key.localeCompare(b.key);
      }
      if (sortBy === 'time') {
        return (b.updatedAt || 0) - (a.updatedAt || 0);
      }
      return 0;
    });
  }, [filteredQueries, sortBy]);

  const selectedQuery = useMemo(() => {
    return queries.find((q) => q.key === selectedKey) || sortedQueries[0] || null;
  }, [queries, selectedKey, sortedQueries]);

  const copyToClipboard = (text: string, id: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedKey(id);
      setTimeout(() => setCopiedKey(null), 1800);
    } catch {}
  };

  const getStatusBadge = (status: QueryEntry['status']) => {
    switch (status) {
      case 'fetching':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-mono flex items-center shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mr-1 animate-pulse" />
            FETCHING
          </span>
        );
      case 'fresh':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono flex items-center shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1" />
            FRESH
          </span>
        );
      case 'stale':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 font-mono flex items-center shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-1" />
            STALE
          </span>
        );
      case 'paused':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30 font-mono flex items-center shrink-0">
            PAUSED
          </span>
        );
      case 'inactive':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-devCard text-devTextMuted border border-devBorder font-mono flex items-center shrink-0">
            INACTIVE
          </span>
        );
      case 'error':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 font-mono flex items-center shrink-0">
            <AlertCircle className="w-3 h-3 mr-1 inline" />
            ERROR
          </span>
        );
      default:
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-devCard text-devTextDim border border-devBorder font-mono">
            {String(status || 'UNKNOWN').toUpperCase()}
          </span>
        );
    }
  };

  // Stats Counters
  const stats = useMemo(() => {
    return {
      all: queries.length,
      fresh: queries.filter((q) => q.status === 'fresh').length,
      fetching: queries.filter((q) => q.status === 'fetching').length,
      stale: queries.filter((q) => q.status === 'stale').length,
      inactive: queries.filter((q) => q.status === 'inactive').length,
      error: queries.filter((q) => q.status === 'error').length,
    };
  }, [queries]);

  // Tab payload extraction
  const getTabPayload = () => {
    if (!selectedQuery) return null;
    if (activeTab === 'data') {
      return selectedQuery.data;
    }
    if (activeTab === 'state') {
      return selectedQuery.state || {
        status: selectedQuery.status,
        fetchStatus: selectedQuery.status === 'fetching' ? 'fetching' : 'idle',
        dataUpdatedAt: selectedQuery.updatedAt,
      };
    }
    return selectedQuery.options || {
      queryKey: selectedQuery.key,
      queryHash: selectedQuery.queryHash,
    };
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-devBg overflow-hidden transition-colors duration-150 select-text">
      {/* Top Header & Search Bar */}
      <div className="h-11 px-4 border-b border-devBorder bg-devSurface flex items-center justify-between space-x-3 shrink-0">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-devTextMuted absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Filter query keys (e.g. ['users', 42])..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-devCard border border-devBorder rounded py-1 pl-8 pr-3 text-xs text-devText placeholder-devTextMuted focus:outline-none focus:border-devAccent font-mono"
          />
        </div>

        {/* Global Action Controls */}
        <div className="flex items-center space-x-2">
          {onRefetchAll && (
            <button
              onClick={onRefetchAll}
              title="Refetch all queries in React Native app"
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-devCard hover:bg-devCardHover text-devText text-xs border border-devBorder transition-colors font-medium"
            >
              <RefreshCw className="w-3 h-3 text-devAccent" />
              <span>Refetch All</span>
            </button>
          )}

          {onClearAll && (
            <button
              onClick={onClearAll}
              title="Clear QueryClient cache"
              className="flex items-center space-x-1 px-2 py-1 rounded bg-devCard hover:bg-devCardHover text-devTextMuted hover:text-rose-500 text-xs border border-devBorder transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}

          {/* Sort Controls */}
          <div className="flex items-center space-x-0.5 bg-devCard p-0.5 rounded border border-devBorder">
            {(['status', 'key', 'time'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSortBy(s)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium capitalize transition-colors ${
                  sortBy === s
                    ? 'bg-devAccent text-white shadow-sm font-semibold'
                    : 'text-devTextMuted hover:text-devText'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Counter Bar */}
      <div className="h-8 px-4 border-b border-devBorder bg-devSurface/50 flex items-center space-x-4 text-[11px] shrink-0 overflow-x-auto">
        <span className="text-devTextDim font-medium">
          Total: <strong className="text-devText font-mono font-bold">{stats.all}</strong>
        </span>
        <span className="text-emerald-400 font-medium">
          Fresh: <strong className="font-mono">{stats.fresh}</strong>
        </span>
        <span className="text-cyan-400 font-medium">
          Fetching: <strong className="font-mono">{stats.fetching}</strong>
        </span>
        <span className="text-amber-400 font-medium">
          Stale: <strong className="font-mono">{stats.stale}</strong>
        </span>
        <span className="text-devTextMuted font-medium">
          Inactive: <strong className="font-mono">{stats.inactive}</strong>
        </span>
        {stats.error > 0 && (
          <span className="text-rose-400 font-medium">
            Error: <strong className="font-mono">{stats.error}</strong>
          </span>
        )}
      </div>

      {/* Main Split View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Query List */}
        <div className="w-1/2 border-r border-devBorder overflow-y-auto bg-devBg select-text">
          {sortedQueries.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-devTextMuted text-xs p-8 text-center select-none">
              <Database className="w-8 h-8 mb-2 stroke-[1.5] text-devTextMuted opacity-60" />
              <p className="font-medium">No TanStack queries found</p>
              <p className="text-[11px] text-devTextMuted/80 mt-1">
                {queries.length === 0
                  ? 'Queries registered in QueryClient will stream here live.'
                  : 'No queries match your search filter.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-devBorder/60">
              {sortedQueries.map((q) => {
                const isSelected = selectedQuery?.key === q.key;
                const observers = q.observersCount ?? 0;

                return (
                  <div
                    key={q.key}
                    onClick={() => setSelectedKey(q.key)}
                    className={`group px-3 py-2.5 text-xs flex items-center justify-between cursor-pointer font-mono transition-colors select-text ${
                      isSelected
                        ? 'bg-devAccent/15 border-l-4 border-devAccent text-devText font-medium'
                        : 'hover:bg-devCardHover/60 text-devText'
                    }`}
                  >
                    <div className="flex items-center space-x-2 truncate flex-1 mr-2">
                      {getStatusBadge(q.status)}

                      {observers > 0 && (
                        <span
                          title={`${observers} active observers on screen`}
                          className="bg-devCard text-devTextDim border border-devBorder px-1.5 py-0.2 rounded-full text-[10px] font-mono shrink-0"
                        >
                          {observers}
                        </span>
                      )}

                      <span className="truncate font-medium text-devText">
                        {formatQueryKey(q.key)}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <span className="text-[10px] text-devTextMuted font-sans whitespace-nowrap">
                        {formatTimeAgo(q.updatedAt)}
                      </span>
                      <span className="text-devTextMuted text-sm opacity-50 group-hover:opacity-100">
                        ›
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Rich Query Details Inspector */}
        <div className="w-1/2 flex flex-col bg-devSurface/40 overflow-hidden select-text">
          {selectedQuery ? (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              {/* Header */}
              <div className="px-4 py-3 border-b border-devBorder bg-devSurface flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-2 truncate flex-1 mr-2">
                  {getStatusBadge(selectedQuery.status)}
                  {(selectedQuery.observersCount ?? 0) > 0 && (
                    <span className="bg-devCard text-devTextDim border border-devBorder px-1.5 py-0.2 rounded-full text-[10px] font-mono">
                      {selectedQuery.observersCount} active
                    </span>
                  )}
                  <span className="text-xs font-mono font-semibold text-devText truncate">
                    {formatQueryKey(selectedQuery.key)}
                  </span>
                </div>

                {/* Tree vs Raw Switcher */}
                <div className="flex items-center space-x-0.5 bg-devCard p-0.5 rounded border border-devBorder shrink-0">
                  <button
                    onClick={() => setViewMode('tree')}
                    className={`flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                      viewMode === 'tree'
                        ? 'bg-devAccent text-white shadow-sm font-semibold'
                        : 'text-devTextMuted hover:text-devText'
                    }`}
                  >
                    <ListTree className="w-3 h-3" />
                    <span>Tree</span>
                  </button>
                  <button
                    onClick={() => setViewMode('raw')}
                    className={`flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                      viewMode === 'raw'
                        ? 'bg-devAccent text-white shadow-sm font-semibold'
                        : 'text-devTextMuted hover:text-devText'
                    }`}
                  >
                    <Code2 className="w-3 h-3" />
                    <span>Raw</span>
                  </button>
                </div>
              </div>

              {/* Action Toolbar (Matching react-native-unified-devtools) */}
              <div className="px-4 py-2 border-b border-devBorder bg-devSurface/60 flex items-center space-x-1.5 overflow-x-auto shrink-0">
                <button
                  onClick={() => onRefetchQuery(selectedQuery.key)}
                  title="Trigger Refetch in Mobile App"
                  className="flex items-center space-x-1 px-2.5 py-1 rounded bg-devCard hover:bg-devCardHover text-devText text-xs border border-devBorder transition-colors font-medium shrink-0"
                >
                  <RefreshCw className="w-3 h-3 text-devAccent" />
                  <span>Refetch</span>
                </button>

                <button
                  onClick={() => onInvalidateQuery(selectedQuery.key)}
                  title="Invalidate Query Cache"
                  className="flex items-center space-x-1 px-2.5 py-1 rounded bg-devCard hover:bg-devCardHover text-devText text-xs border border-devBorder transition-colors font-medium shrink-0"
                >
                  <Zap className="w-3 h-3 text-amber-500" />
                  <span>Invalidate</span>
                </button>

                <button
                  onClick={() => onResetQuery(selectedQuery.key)}
                  title="Reset Query to Initial State"
                  className="flex items-center space-x-1 px-2.5 py-1 rounded bg-devCard hover:bg-devCardHover text-devText text-xs border border-devBorder transition-colors font-medium shrink-0"
                >
                  <RotateCcw className="w-3 h-3 text-sky-400" />
                  <span>Reset</span>
                </button>

                {onRemoveQuery && (
                  <button
                    onClick={() => onRemoveQuery(selectedQuery.key)}
                    title="Remove Query from Cache"
                    className="flex items-center space-x-1 px-2 py-1 rounded bg-devCard hover:bg-devCardHover text-devTextMuted hover:text-rose-500 text-xs border border-devBorder transition-colors shrink-0"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Remove</span>
                  </button>
                )}

                {onTriggerLoading && (
                  <button
                    onClick={() => onTriggerLoading(selectedQuery.key)}
                    title="Simulate Loading State in Mobile App"
                    className="flex items-center space-x-1 px-2 py-1 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-xs border border-cyan-500/30 transition-colors shrink-0"
                  >
                    <span>+Load</span>
                  </button>
                )}

                {onTriggerError && (
                  <button
                    onClick={() => onTriggerError(selectedQuery.key)}
                    title="Simulate Error State in Mobile App"
                    className="flex items-center space-x-1 px-2 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs border border-rose-500/30 transition-colors shrink-0"
                  >
                    <span>+Err</span>
                  </button>
                )}
              </div>

              {/* Meta Card (Matching react-native-unified-devtools) */}
              <div className="p-3 mx-4 mt-3 rounded-lg bg-devCard border border-devBorder text-xs shrink-0 select-text">
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="flex items-center justify-between pr-3 border-r border-devBorder/60">
                    <span className="text-devTextMuted">Observers:</span>
                    <strong className="text-devText font-mono">{selectedQuery.observersCount ?? 0}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-devTextMuted">Status:</span>
                    <strong className="text-devText font-mono uppercase">{selectedQuery.state?.status || selectedQuery.status}</strong>
                  </div>
                  <div className="flex items-center justify-between pr-3 border-r border-devBorder/60">
                    <span className="text-devTextMuted">Fetch status:</span>
                    <strong className="text-devText font-mono uppercase">{selectedQuery.state?.fetchStatus || (selectedQuery.status === 'fetching' ? 'fetching' : 'idle')}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-devTextMuted">Updated:</span>
                    <span className="text-devText font-mono">{formatTimeAgo(selectedQuery.updatedAt)}</span>
                  </div>
                </div>

                {selectedQuery.state?.error && (
                  <div className="mt-2 pt-2 border-t border-rose-500/30 text-rose-400 font-mono text-[11px]">
                    Error: {String(selectedQuery.state.error)}
                  </div>
                )}
              </div>

              {/* Three Detail Tabs */}
              <div className="px-4 pt-3 flex items-center justify-between border-b border-devBorder shrink-0">
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setActiveTab('data')}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium border-b-2 transition-colors ${
                      activeTab === 'data'
                        ? 'border-devAccent text-devAccent font-semibold'
                        : 'border-transparent text-devTextMuted hover:text-devText'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Data Explorer</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('state')}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium border-b-2 transition-colors ${
                      activeTab === 'state'
                        ? 'border-devAccent text-devAccent font-semibold'
                        : 'border-transparent text-devTextMuted hover:text-devText'
                    }`}
                  >
                    <Activity className="w-3.5 h-3.5" />
                    <span>State</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('options')}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium border-b-2 transition-colors ${
                      activeTab === 'options'
                        ? 'border-devAccent text-devAccent font-semibold'
                        : 'border-transparent text-devTextMuted hover:text-devText'
                    }`}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>Options</span>
                  </button>
                </div>

                {/* Copy Tab JSON button */}
                <button
                  onClick={() =>
                    copyToClipboard(
                      JSON.stringify(getTabPayload(), null, 2),
                      activeTab + '_' + selectedQuery.key
                    )
                  }
                  className="flex items-center space-x-1 text-[11px] text-devAccent hover:underline py-1"
                >
                  {copiedKey === activeTab + '_' + selectedQuery.key ? (
                    <Check className="w-3 h-3 text-emerald-500" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  <span>{copiedKey === activeTab + '_' + selectedQuery.key ? 'Copied' : 'Copy JSON'}</span>
                </button>
              </div>

              {/* Tab Content Explorer */}
              <div className="flex-1 overflow-y-auto p-4 select-text">
                {viewMode === 'tree' ? (
                  <div className="p-3 bg-devCodeBg rounded-lg border border-devBorder overflow-x-auto select-text">
                    {getTabPayload() !== undefined && getTabPayload() !== null ? (
                      <JsonTree data={getTabPayload()} defaultExpandedDepth={2} />
                    ) : (
                      <span className="text-devTextMuted text-xs font-mono italic">
                        // No data cached or empty
                      </span>
                    )}
                  </div>
                ) : (
                  <pre className="p-3 bg-devCodeBg rounded-lg border border-devBorder text-xs font-mono text-devText overflow-x-auto whitespace-pre-wrap select-text">
                    {getTabPayload() !== undefined && getTabPayload() !== null
                      ? JSON.stringify(getTabPayload(), null, 2)
                      : '// No data cached or empty'}
                  </pre>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-devTextMuted text-xs select-none">
              Select a query from the list to view its cached data, state, and options
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

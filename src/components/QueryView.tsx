import { useState, useMemo } from 'react';
import { QueryEntry } from '../types';
import { Search, Database, RefreshCw, Zap, Trash2, Check, Copy } from 'lucide-react';

interface QueryViewProps {
  queries: QueryEntry[];
  onRefetchQuery: (queryKey: string) => void;
  onInvalidateQuery: (queryKey: string) => void;
  onResetQuery: (queryKey: string) => void;
}

export const QueryView: React.FC<QueryViewProps> = ({
  queries,
  onRefetchQuery,
  onInvalidateQuery,
  onResetQuery,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const filteredQueries = useMemo(() => {
    return queries.filter((q) => {
      if (!searchQuery) return true;
      return q.key.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [queries, searchQuery]);

  const selectedQuery = useMemo(() => {
    return queries.find((q) => q.key === selectedKey) || filteredQueries[0] || null;
  }, [queries, selectedKey, filteredQueries]);

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusBadge = (status: QueryEntry['status']) => {
    switch (status) {
      case 'fetching':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-500 border border-cyan-500/30 font-mono">FETCHING</span>;
      case 'fresh':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 font-mono">FRESH</span>;
      case 'stale':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-500 border border-amber-500/30 font-mono">STALE</span>;
      case 'error':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-500 border border-rose-500/30 font-mono">ERROR</span>;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-devBg overflow-hidden transition-colors duration-150">
      {/* Top Search & Filter Bar */}
      <div className="h-11 px-4 border-b border-devBorder bg-devSurface flex items-center justify-between space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-devTextMuted absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Search query keys (e.g. ['users', 42])..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-devCard border border-devBorder rounded py-1 pl-8 pr-3 text-xs text-devText placeholder-devTextMuted focus:outline-none focus:border-devAccent"
          />
        </div>

        <div className="flex items-center space-x-2 text-xs text-devTextMuted">
          <span>Total queries: <strong className="text-devText font-mono">{queries.length}</strong></span>
        </div>
      </div>

      {/* Main Split View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Query Keys List */}
        <div className="w-1/2 border-r border-devBorder overflow-y-auto bg-devBg">
          {filteredQueries.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-devTextMuted text-xs p-8 text-center">
              <Database className="w-8 h-8 mb-2 stroke-[1.5] text-devTextMuted opacity-60" />
              <p className="font-medium">No TanStack Query cache registered</p>
              <p className="text-[11px] text-devTextMuted/80 mt-1">Queries registered in QueryClient will display here automatically.</p>
            </div>
          ) : (
            <div className="divide-y divide-devBorder/60">
              {filteredQueries.map((q) => {
                const isSelected = selectedQuery?.key === q.key;
                return (
                  <div
                    key={q.key}
                    onClick={() => setSelectedKey(q.key)}
                    className={`px-3 py-2 text-xs flex items-center justify-between cursor-pointer font-mono transition-colors ${
                      isSelected
                        ? 'bg-devAccent/15 border-l-4 border-devAccent text-devText'
                        : 'hover:bg-devCardHover/60 text-devText'
                    }`}
                  >
                    <div className="flex items-center space-x-2 truncate flex-1 mr-2">
                      {getStatusBadge(q.status)}
                      <span className="truncate font-semibold">{q.key}</span>
                    </div>
                    <span className="text-[10px] text-devTextMuted whitespace-nowrap">
                      {new Date(q.updatedAt).toLocaleTimeString()}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Query Data & Actions */}
        <div className="w-1/2 flex flex-col bg-devSurface/40 overflow-hidden">
          {selectedQuery ? (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              {/* Header with Actions */}
              <div className="px-4 py-2.5 border-b border-devBorder bg-devSurface flex items-center justify-between">
                <div className="flex items-center space-x-2 truncate mr-2">
                  {getStatusBadge(selectedQuery.status)}
                  <span className="text-xs font-mono font-bold text-devText truncate">
                    {selectedQuery.key}
                  </span>
                </div>

                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => onRefetchQuery(selectedQuery.key)}
                    title="Trigger Refetch in Mobile App"
                    className="flex items-center space-x-1 px-2 py-1 rounded bg-devCard hover:bg-devCardHover text-devText text-[11px] border border-devBorder transition-colors"
                  >
                    <RefreshCw className="w-3 h-3 text-devAccent" />
                    <span>Refetch</span>
                  </button>
                  <button
                    onClick={() => onInvalidateQuery(selectedQuery.key)}
                    title="Invalidate Query Cache"
                    className="flex items-center space-x-1 px-2 py-1 rounded bg-devCard hover:bg-devCardHover text-devText text-[11px] border border-devBorder transition-colors"
                  >
                    <Zap className="w-3 h-3 text-amber-500" />
                    <span>Invalidate</span>
                  </button>
                  <button
                    onClick={() => onResetQuery(selectedQuery.key)}
                    title="Reset Query Cache"
                    className="p-1 rounded bg-devCard hover:bg-devCardHover text-devTextMuted hover:text-rose-500 text-[11px] border border-devBorder transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Data Explorer */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-wider text-devTextDim font-semibold">Cached Data</span>
                  <button
                    onClick={() => copyText(JSON.stringify(selectedQuery.data, null, 2))}
                    className="text-[11px] text-devAccent hover:underline flex items-center space-x-1"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied' : 'Copy JSON'}</span>
                  </button>
                </div>

                <pre className="p-3 bg-devCodeBg rounded-lg border border-devBorder text-xs font-mono text-devText overflow-x-auto whitespace-pre-wrap">
                  {selectedQuery.data !== undefined
                    ? JSON.stringify(selectedQuery.data, null, 2)
                    : '// No data cached or query is loading'}
                </pre>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-devTextMuted text-xs">
              Select a query from the list to view cached data and run refetch actions
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import { useState, useMemo } from 'react';
import { ConsoleEntry } from '../types';
import { Search, Copy, Check, AlertCircle, AlertTriangle, Info, Terminal, Trash2 } from 'lucide-react';

interface ConsoleViewProps {
  logs: ConsoleEntry[];
  onClear: () => void;
}

export const ConsoleView: React.FC<ConsoleViewProps> = ({ logs, onClear }) => {
  const [filterLevel, setFilterLevel] = useState<'all' | 'log' | 'info' | 'warn' | 'error'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (filterLevel !== 'all' && log.level !== filterLevel) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      const content = JSON.stringify(log.args).toLowerCase();
      const stack = (log.stack || '').toLowerCase();
      return content.includes(q) || stack.includes(q);
    });
  }, [logs, filterLevel, searchQuery]);

  const selectedLog = useMemo(() => {
    return logs.find((l) => l.id === selectedLogId) || filteredLogs[0] || null;
  }, [logs, selectedLogId, filteredLogs]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getLevelBadge = (level: ConsoleEntry['level']) => {
    switch (level) {
      case 'error':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-500 border border-rose-500/30 flex items-center"><AlertCircle className="w-3 h-3 mr-1 inline" />ERR</span>;
      case 'warn':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-500 border border-amber-500/30 flex items-center"><AlertTriangle className="w-3 h-3 mr-1 inline" />WARN</span>;
      case 'info':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-500 border border-sky-500/30 flex items-center"><Info className="w-3 h-3 mr-1 inline" />INFO</span>;
      default:
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-devCard text-devTextDim border border-devBorder flex items-center"><Terminal className="w-3 h-3 mr-1 inline" />LOG</span>;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-devBg overflow-hidden transition-colors duration-150">
      {/* Top Filter Bar */}
      <div className="h-11 px-4 border-b border-devBorder bg-devSurface flex items-center justify-between space-x-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-devTextMuted absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Search console logs, messages, stack..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-devCard border border-devBorder rounded py-1 pl-8 pr-3 text-xs text-devText placeholder-devTextMuted focus:outline-none focus:border-devAccent"
          />
        </div>

        {/* Level Filters & Clear */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 bg-devCard p-0.5 rounded border border-devBorder">
            {(['all', 'log', 'info', 'warn', 'error'] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setFilterLevel(lvl)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium capitalize transition-colors ${
                  filterLevel === lvl
                    ? 'bg-devAccent text-white shadow-sm font-semibold'
                    : 'text-devTextMuted hover:text-devText'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          <button
            onClick={onClear}
            title="Clear Console Logs"
            className="p-1 rounded bg-devCard hover:bg-devCardHover text-devTextMuted hover:text-rose-500 border border-devBorder transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Split Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Log Table */}
        <div className="w-1/2 border-r border-devBorder overflow-y-auto bg-devBg">
          {filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-devTextMuted text-xs p-8 text-center">
              <Terminal className="w-8 h-8 mb-2 stroke-[1.5] text-devTextMuted opacity-60" />
              <p className="font-medium">No console messages captured yet</p>
              <p className="text-[11px] text-devTextMuted/80 mt-1">Logs sent via console.log, info, warn, or error in your React Native app will stream here.</p>
            </div>
          ) : (
            <div className="divide-y divide-devBorder/60">
              {filteredLogs.map((log) => {
                const isSelected = selectedLog?.id === log.id;
                const timeStr = new Date(log.timestamp).toLocaleTimeString();
                const previewText = log.args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');

                return (
                  <div
                    key={log.id}
                    onClick={() => setSelectedLogId(log.id)}
                    className={`px-3 py-2 text-xs flex items-start space-x-2.5 cursor-pointer font-mono transition-colors ${
                      isSelected
                        ? 'bg-devAccent/15 border-l-4 border-devAccent text-devText'
                        : 'hover:bg-devCardHover/60 text-devText'
                    }`}
                  >
                    <span className="text-[10px] text-devTextMuted whitespace-nowrap pt-0.5">{timeStr}</span>
                    <div className="pt-0.5">{getLevelBadge(log.level)}</div>
                    <div className="flex-1 truncate">
                      {previewText}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Log Inspector Pane */}
        <div className="w-1/2 flex flex-col bg-devSurface/40 overflow-hidden">
          {selectedLog ? (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              <div className="px-4 py-2.5 border-b border-devBorder bg-devSurface flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getLevelBadge(selectedLog.level)}
                  <span className="text-xs font-mono text-devTextMuted">
                    {new Date(selectedLog.timestamp).toISOString()}
                  </span>
                </div>
                <button
                  onClick={() => copyToClipboard(JSON.stringify(selectedLog.args, null, 2))}
                  className="flex items-center space-x-1 px-2 py-1 rounded bg-devCard hover:bg-devCardHover text-devText text-[11px] border border-devBorder transition-colors"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied' : 'Copy JSON'}</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Arguments dump */}
                <div>
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-devTextDim mb-1.5">
                    Payload Arguments
                  </h3>
                  <pre className="p-3 bg-devCodeBg rounded-lg border border-devBorder text-xs font-mono text-devText overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(selectedLog.args, null, 2)}
                  </pre>
                </div>

                {/* Stack Trace */}
                {selectedLog.stack && (
                  <div>
                    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-rose-500 mb-1.5">
                      Stack Trace
                    </h3>
                    <pre className="p-3 bg-rose-500/10 rounded-lg border border-rose-500/30 text-[11px] font-mono text-rose-500 overflow-x-auto whitespace-pre-wrap">
                      {selectedLog.stack}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-devTextMuted text-xs">
              Select a log entry from the list to view full payload and stack
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

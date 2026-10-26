import React, { useState, useMemo } from 'react';
import { ConsoleEntry } from '../types';
import { 
  Search, 
  Copy, 
  Check, 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  Terminal, 
  Trash2, 
  Bug, 
  ListTree, 
  Code2 
} from 'lucide-react';
import { JsonTree } from './JsonTree';

interface ConsoleViewProps {
  logs: ConsoleEntry[];
  onClear: () => void;
}

export const ConsoleView: React.FC<ConsoleViewProps> = ({ logs, onClear }) => {
  const [filterLevel, setFilterLevel] = useState<'all' | 'log' | 'info' | 'warn' | 'error' | 'debug'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [inspectorMode, setInspectorMode] = useState<'tree' | 'raw'>('tree');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [treeExpandedKey, setTreeExpandedKey] = useState<number>(0);

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

  const copyToClipboard = (text: string, id: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch {}
  };

  const getLevelBadge = (level: ConsoleEntry['level']) => {
    switch (level) {
      case 'error':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center shrink-0">
            <AlertCircle className="w-3 h-3 mr-1 inline" />ERR
          </span>
        );
      case 'warn':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center shrink-0">
            <AlertTriangle className="w-3 h-3 mr-1 inline" />WARN
          </span>
        );
      case 'info':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center shrink-0">
            <Info className="w-3 h-3 mr-1 inline" />INFO
          </span>
        );
      case 'debug':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center shrink-0">
            <Bug className="w-3 h-3 mr-1 inline" />DEBUG
          </span>
        );
      default:
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-devCard text-devTextDim border border-devBorder flex items-center shrink-0">
            <Terminal className="w-3 h-3 mr-1 inline" />LOG
          </span>
        );
    }
  };

  const renderInlinePreview = (args: any[]) => {
    if (!Array.isArray(args) || args.length === 0) return <span className="text-devTextMuted italic">empty</span>;

    return args.map((arg, idx) => {
      if (arg === null) {
        return <span key={idx} className="text-devTextMuted italic mr-1.5">null</span>;
      }
      if (arg === undefined) {
        return <span key={idx} className="text-devTextMuted italic mr-1.5">undefined</span>;
      }
      if (typeof arg === 'string') {
        return <span key={idx} className="text-emerald-400 dark:text-emerald-300 mr-1.5">"{arg}"</span>;
      }
      if (typeof arg === 'number') {
        return <span key={idx} className="text-sky-400 dark:text-sky-300 mr-1.5">{arg}</span>;
      }
      if (typeof arg === 'boolean') {
        return <span key={idx} className="text-amber-400 dark:text-amber-300 mr-1.5">{String(arg)}</span>;
      }
      if (Array.isArray(arg)) {
        return (
          <span key={idx} className="text-devTextDim mr-1.5">
            <span className="text-devTextMuted font-sans text-[10px] mr-0.5">Array({arg.length})</span>
            [{arg.slice(0, 2).map((a) => (typeof a === 'object' ? '{...}' : String(a))).join(', ')}{arg.length > 2 ? ', …' : ''}]
          </span>
        );
      }
      if (typeof arg === 'object') {
        const keys = Object.keys(arg);
        return (
          <span key={idx} className="text-devTextDim mr-1.5">
            {'{'}{keys.slice(0, 3).map((k) => `${k}: ${typeof arg[k] === 'object' ? '{...}' : String(arg[k])}`).join(', ')}{keys.length > 3 ? ', …' : ''}{'}'}
          </span>
        );
      }
      return <span key={idx} className="text-devText mr-1.5">{String(arg)}</span>;
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-devBg overflow-hidden transition-colors duration-150 select-text">
      {/* Top Filter Bar */}
      <div className="h-11 px-4 border-b border-devBorder bg-devSurface flex items-center justify-between space-x-4 shrink-0">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-devTextMuted absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Search console logs, messages, stack (regex or keyword)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-devCard border border-devBorder rounded py-1 pl-8 pr-3 text-xs text-devText placeholder-devTextMuted focus:outline-none focus:border-devAccent font-mono"
          />
        </div>

        {/* Level Filters & Clear */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 bg-devCard p-0.5 rounded border border-devBorder">
            {(['all', 'log', 'info', 'warn', 'error', 'debug'] as const).map((lvl) => (
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
        {/* Left: Log Table / Stream */}
        <div className="w-1/2 border-r border-devBorder overflow-y-auto bg-devBg select-text">
          {filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-devTextMuted text-xs p-8 text-center select-none">
              <Terminal className="w-8 h-8 mb-2 stroke-[1.5] text-devTextMuted opacity-60" />
              <p className="font-medium">No console messages captured yet</p>
              <p className="text-[11px] text-devTextMuted/80 mt-1">
                Logs emitted via console.log, info, warn, error, or debug stream here live.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-devBorder/60">
              {filteredLogs.map((log) => {
                const isSelected = selectedLog?.id === log.id;
                const isError = log.level === 'error';
                const isWarn = log.level === 'warn';
                const timeStr = new Date(log.timestamp).toLocaleTimeString();

                return (
                  <div
                    key={log.id}
                    onClick={() => setSelectedLogId(log.id)}
                    className={`group px-3 py-2 text-xs flex items-start space-x-2.5 cursor-pointer font-mono transition-colors select-text ${
                      isSelected
                        ? 'bg-devAccent/15 border-l-4 border-devAccent text-devText'
                        : isError
                        ? 'bg-rose-500/5 hover:bg-rose-500/10 border-l-2 border-rose-500/50 text-devText'
                        : isWarn
                        ? 'bg-amber-500/5 hover:bg-amber-500/10 border-l-2 border-amber-500/50 text-devText'
                        : 'hover:bg-devCardHover/60 text-devText'
                    }`}
                  >
                    <span className="text-[10px] text-devTextMuted whitespace-nowrap pt-0.5 select-text">
                      {timeStr}
                    </span>
                    <div className="pt-0.5">{getLevelBadge(log.level)}</div>
                    <div className="flex-1 truncate select-text">
                      {renderInlinePreview(log.args)}
                    </div>
                    {/* Quick copy row */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(JSON.stringify(log.args, null, 2), log.id);
                      }}
                      title="Copy log payload"
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-devCard text-devTextMuted hover:text-devAccent transition-opacity"
                    >
                      {copiedId === log.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Chrome DevTools Inspector Pane */}
        <div className="w-1/2 flex flex-col bg-devSurface/40 overflow-hidden select-text">
          {selectedLog ? (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              {/* Header Bar */}
              <div className="px-4 py-2.5 border-b border-devBorder bg-devSurface flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-2">
                  {getLevelBadge(selectedLog.level)}
                  <span className="text-xs font-mono text-devTextMuted select-text">
                    {new Date(selectedLog.timestamp).toISOString()}
                  </span>
                </div>

                <div className="flex items-center space-x-1.5">
                  {/* Mode switcher: Tree vs Raw */}
                  <div className="flex items-center space-x-0.5 bg-devCard p-0.5 rounded border border-devBorder mr-2">
                    <button
                      onClick={() => setInspectorMode('tree')}
                      title="Interactive Object Tree (Chrome DevTools style)"
                      className={`flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                        inspectorMode === 'tree'
                          ? 'bg-devAccent text-white shadow-sm font-semibold'
                          : 'text-devTextMuted hover:text-devText'
                      }`}
                    >
                      <ListTree className="w-3 h-3" />
                      <span>Tree</span>
                    </button>
                    <button
                      onClick={() => setInspectorMode('raw')}
                      title="Raw JSON Code"
                      className={`flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                        inspectorMode === 'raw'
                          ? 'bg-devAccent text-white shadow-sm font-semibold'
                          : 'text-devTextMuted hover:text-devText'
                      }`}
                    >
                      <Code2 className="w-3 h-3" />
                      <span>Raw</span>
                    </button>
                  </div>

                  {inspectorMode === 'tree' && (
                    <button
                      onClick={() => setTreeExpandedKey((k) => k + 1)}
                      title="Toggle Expand All"
                      className="px-2 py-1 rounded bg-devCard hover:bg-devCardHover text-devText text-[11px] border border-devBorder transition-colors font-medium"
                    >
                      Reset Tree
                    </button>
                  )}

                  <button
                    onClick={() =>
                      copyToClipboard(
                        JSON.stringify(
                          {
                            level: selectedLog.level,
                            timestamp: selectedLog.timestamp,
                            args: selectedLog.args,
                            stack: selectedLog.stack,
                          },
                          null,
                          2
                        ),
                        'all_' + selectedLog.id
                      )
                    }
                    className="flex items-center space-x-1 px-2.5 py-1 rounded bg-devCard hover:bg-devCardHover text-devText text-[11px] border border-devBorder transition-colors font-medium"
                  >
                    {copiedId === 'all_' + selectedLog.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedId === 'all_' + selectedLog.id ? 'Copied' : 'Copy All'}</span>
                  </button>
                </div>
              </div>

              {/* Inspector Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 select-text">
                {/* Arguments View */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-devTextDim">
                      Console Arguments ({selectedLog.args.length})
                    </h3>
                    <button
                      onClick={() =>
                        copyToClipboard(JSON.stringify(selectedLog.args, null, 2), 'args_' + selectedLog.id)
                      }
                      className="text-[11px] text-devAccent hover:underline flex items-center space-x-1"
                    >
                      {copiedId === 'args_' + selectedLog.id ? (
                        <Check className="w-3 h-3 text-emerald-500" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span>Copy Arguments</span>
                    </button>
                  </div>

                  {inspectorMode === 'tree' ? (
                    <div
                      key={treeExpandedKey}
                      className="p-3 bg-devCodeBg rounded-lg border border-devBorder space-y-2 select-text"
                    >
                      {selectedLog.args.map((arg, idx) => (
                        <div key={idx} className="border-b border-devBorder/30 last:border-b-0 pb-2 last:pb-0">
                          {selectedLog.args.length > 1 && (
                            <span className="text-[10px] text-devTextMuted uppercase font-mono mb-1 block">
                              Arg #{idx + 1}
                            </span>
                          )}
                          <JsonTree data={arg} defaultExpandedDepth={2} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <pre className="p-3 bg-devCodeBg rounded-lg border border-devBorder text-xs font-mono text-devText overflow-x-auto whitespace-pre-wrap select-text">
                      {JSON.stringify(selectedLog.args, null, 2)}
                    </pre>
                  )}
                </div>

                {/* Stack Trace */}
                {selectedLog.stack && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-rose-500">
                        Error Stack Trace
                      </h3>
                      <button
                        onClick={() => copyToClipboard(selectedLog.stack || '', 'stack_' + selectedLog.id)}
                        className="text-[11px] text-rose-400 hover:underline flex items-center space-x-1"
                      >
                        {copiedId === 'stack_' + selectedLog.id ? (
                          <Check className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>Copy Stack</span>
                      </button>
                    </div>
                    <pre className="p-3 bg-rose-500/10 rounded-lg border border-rose-500/30 text-[11px] font-mono text-rose-400 overflow-x-auto whitespace-pre-wrap select-text">
                      {selectedLog.stack}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-devTextMuted text-xs select-none">
              Select a log entry from the list to view its Chrome DevTools object tree and stack
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

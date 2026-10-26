import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Copy, Check } from 'lucide-react';

export interface JsonTreeProps {
  data: unknown;
  name?: string;
  depth?: number;
  isLast?: boolean;
  initiallyExpanded?: boolean;
  defaultExpandedDepth?: number;
}

export const JsonTree: React.FC<JsonTreeProps> = ({
  data,
  name,
  depth = 0,
  isLast = true,
  initiallyExpanded,
  defaultExpandedDepth = 1,
}) => {
  const shouldExpand = initiallyExpanded !== undefined ? initiallyExpanded : depth < defaultExpandedDepth;
  const [expanded, setExpanded] = useState<boolean>(shouldExpand);
  const [copied, setCopied] = useState<boolean>(false);

  const copyValue = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const text = typeof data === 'object' && data !== null ? JSON.stringify(data, null, 2) : String(data);
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  const copyRow = (
    <button
      onClick={copyValue}
      title="Copy value"
      className="opacity-0 group-hover:opacity-100 ml-2 p-0.5 rounded text-devTextMuted hover:text-devAccent transition-opacity transition-colors"
    >
      {copied ? <Check className="w-3 h-3 text-emerald-500 inline" /> : <Copy className="w-3 h-3 inline" />}
    </button>
  );

  const renderKey = () => {
    if (name === undefined) return null;
    return (
      <span className="font-mono text-purple-400 dark:text-purple-300 font-medium select-text">
        {name}
        <span className="text-devTextMuted mr-1">:</span>
      </span>
    );
  };

  if (data === null) {
    return (
      <div className="group flex items-center font-mono text-xs py-0.5 select-text hover:bg-devCardHover/40 rounded px-1 -mx-1">
        {renderKey()}
        <span className="text-devTextMuted italic">null</span>
        {!isLast && <span className="text-devTextMuted">,</span>}
        {copyRow}
      </div>
    );
  }

  if (data === undefined) {
    return (
      <div className="group flex items-center font-mono text-xs py-0.5 select-text hover:bg-devCardHover/40 rounded px-1 -mx-1">
        {renderKey()}
        <span className="text-devTextMuted italic">undefined</span>
        {!isLast && <span className="text-devTextMuted">,</span>}
        {copyRow}
      </div>
    );
  }

  const type = typeof data;

  if (type === 'string') {
    return (
      <div className="group flex items-center font-mono text-xs py-0.5 select-text hover:bg-devCardHover/40 rounded px-1 -mx-1 break-all">
        {renderKey()}
        <span className="text-emerald-400 dark:text-emerald-300">"{String(data)}"</span>
        {!isLast && <span className="text-devTextMuted">,</span>}
        {copyRow}
      </div>
    );
  }

  if (type === 'number') {
    return (
      <div className="group flex items-center font-mono text-xs py-0.5 select-text hover:bg-devCardHover/40 rounded px-1 -mx-1">
        {renderKey()}
        <span className="text-sky-400 dark:text-sky-300">{String(data)}</span>
        {!isLast && <span className="text-devTextMuted">,</span>}
        {copyRow}
      </div>
    );
  }

  if (type === 'boolean') {
    return (
      <div className="group flex items-center font-mono text-xs py-0.5 select-text hover:bg-devCardHover/40 rounded px-1 -mx-1">
        {renderKey()}
        <span className="text-amber-400 dark:text-amber-300">{String(data)}</span>
        {!isLast && <span className="text-devTextMuted">,</span>}
        {copyRow}
      </div>
    );
  }

  if (type === 'function') {
    return (
      <div className="group flex items-center font-mono text-xs py-0.5 select-text hover:bg-devCardHover/40 rounded px-1 -mx-1">
        {renderKey()}
        <span className="text-devTextMuted italic font-normal">ƒ()</span>
        {copyRow}
      </div>
    );
  }

  if (Array.isArray(data)) {
    const isEmpty = data.length === 0;

    const summaryPreview = () => {
      const items = data.slice(0, 3).map((item) => {
        if (item === null) return 'null';
        if (typeof item === 'object') return '{...}';
        if (typeof item === 'string') return `"${item}"`;
        return String(item);
      });
      if (data.length > 3) items.push('...');
      return items.join(', ');
    };

    return (
      <div className="font-mono text-xs py-0.5 select-text">
        <div
          onClick={() => !isEmpty && setExpanded(!expanded)}
          className={`group flex items-center rounded px-1 -mx-1 hover:bg-devCardHover/40 transition-colors ${
            !isEmpty ? 'cursor-pointer' : ''
          }`}
        >
          <span className="w-4 h-4 mr-0.5 flex items-center justify-center text-devTextMuted">
            {!isEmpty && (expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />)}
          </span>
          {renderKey()}
          <span className="text-devTextMuted font-sans text-[11px] mr-1">
            Array({data.length})
          </span>
          <span className="text-devTextMuted font-mono">[</span>
          {!expanded && (
            <span className="text-devTextMuted/80 text-[11px] px-1 font-mono truncate max-w-xs">
              {summaryPreview()}
            </span>
          )}
          {(!expanded || isEmpty) && (
            <>
              <span className="text-devTextMuted font-mono">]</span>
              {!isLast && <span className="text-devTextMuted">,</span>}
            </>
          )}
          {copyRow}
        </div>

        {expanded && !isEmpty && (
          <div className="border-l border-devBorder/50 ml-2.5 pl-3 space-y-0.5 my-0.5">
            {data.map((item, idx) => (
              <JsonTree
                key={idx}
                data={item}
                name={String(idx)}
                depth={depth + 1}
                isLast={idx === data.length - 1}
                defaultExpandedDepth={defaultExpandedDepth}
              />
            ))}
            <div className="text-devTextMuted font-mono -ml-3 pl-3">
              ]{!isLast ? ',' : ''}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (type === 'object') {
    const keys = Object.keys(data as Record<string, unknown>);
    const isEmpty = keys.length === 0;

    const summaryPreview = () => {
      const parts = keys.slice(0, 3).map((k) => {
        const val = (data as any)[k];
        let valStr = '{...}';
        if (val === null) valStr = 'null';
        else if (typeof val === 'string') valStr = `"${val.length > 15 ? val.slice(0, 15) + '…' : val}"`;
        else if (typeof val === 'number' || typeof val === 'boolean') valStr = String(val);
        else if (Array.isArray(val)) valStr = `[${val.length}]`;
        return `${k}: ${valStr}`;
      });
      if (keys.length > 3) parts.push('...');
      return parts.join(', ');
    };

    return (
      <div className="font-mono text-xs py-0.5 select-text">
        <div
          onClick={() => !isEmpty && setExpanded(!expanded)}
          className={`group flex items-center rounded px-1 -mx-1 hover:bg-devCardHover/40 transition-colors ${
            !isEmpty ? 'cursor-pointer' : ''
          }`}
        >
          <span className="w-4 h-4 mr-0.5 flex items-center justify-center text-devTextMuted">
            {!isEmpty && (expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />)}
          </span>
          {renderKey()}
          <span className="text-devTextMuted font-mono">{'{'}</span>
          {!expanded && (
            <span className="text-devTextMuted/80 text-[11px] px-1 font-mono truncate max-w-sm">
              {summaryPreview()}
            </span>
          )}
          {(!expanded || isEmpty) && (
            <>
              <span className="text-devTextMuted font-mono">{'}'}</span>
              {!isLast && <span className="text-devTextMuted">,</span>}
            </>
          )}
          {copyRow}
        </div>

        {expanded && !isEmpty && (
          <div className="border-l border-devBorder/50 ml-2.5 pl-3 space-y-0.5 my-0.5">
            {keys.map((k, idx) => (
              <JsonTree
                key={k}
                data={(data as any)[k]}
                name={k}
                depth={depth + 1}
                isLast={idx === keys.length - 1}
                defaultExpandedDepth={defaultExpandedDepth}
              />
            ))}
            <div className="text-devTextMuted font-mono -ml-3 pl-3">
              {'}'}{!isLast ? ',' : ''}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="font-mono text-xs py-0.5 select-text">
      {renderKey()}
      <span className="text-devText">{String(data)}</span>
      {!isLast && <span className="text-devTextMuted">,</span>}
      {copyRow}
    </div>
  );
};

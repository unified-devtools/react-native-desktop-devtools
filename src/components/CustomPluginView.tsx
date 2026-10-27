import { useState, useMemo } from 'react';
import { CustomPluginSchema } from '../types';
import { Search, Play } from 'lucide-react';
import { JsonTree } from './JsonTree';
import { PluginIcon } from './PluginIcon';

interface CustomPluginViewProps {
  schema: CustomPluginSchema;
  events: any[];
  onTriggerAction: (pluginId: string, actionId: string) => void;
}

export const CustomPluginView: React.FC<CustomPluginViewProps> = ({
  schema,
  events,
  onTriggerAction,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const filteredEvents = useMemo(() => {
    if (!searchQuery) return events;
    const q = searchQuery.toLowerCase();
    return events.filter((e) => JSON.stringify(e).toLowerCase().includes(q));
  }, [events, searchQuery]);

  const selectedEvent = useMemo(() => {
    if (selectedIndex === null) return filteredEvents[0] || null;
    return filteredEvents[selectedIndex] || null;
  }, [filteredEvents, selectedIndex]);

  return (
    <div className="flex-1 flex flex-col h-full bg-devBg overflow-hidden transition-colors duration-150">
      {/* Top Header & Actions Bar */}
      <div className="h-11 px-4 border-b border-devBorder bg-devSurface flex items-center justify-between space-x-4">
        <div className="flex items-center space-x-2 shrink-0">
          <PluginIcon icon={schema.icon} id={schema.id} className="w-4 h-4 shrink-0" />
          <span className="text-xs font-semibold text-devText whitespace-nowrap">{schema.title}</span>
        </div>

        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-devTextMuted absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder={`Filter ${schema.title} entries...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-devCard border border-devBorder rounded py-1 pl-8 pr-3 text-xs text-devText placeholder-devTextMuted focus:outline-none focus:border-devAccent"
          />
        </div>

        {/* Plugin Actions */}
        <div className="flex items-center space-x-2">
          {schema.actions.map((act) => (
            <button
              key={act.id}
              onClick={() => onTriggerAction(schema.id, act.id)}
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-fuchsia-500/20 hover:bg-fuchsia-500/30 text-fuchsia-500 border border-fuchsia-500/30 text-xs font-medium transition-colors"
            >
              <Play className="w-3 h-3" />
              <span>{act.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Split Table & Detail */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Dynamic Table */}
        <div className="w-1/2 border-r border-devBorder overflow-y-auto bg-devBg">
          {filteredEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-devTextMuted text-xs p-8 text-center">
              <PluginIcon icon={schema.icon} id={schema.id} className="w-8 h-8 mb-2 stroke-[1.5] opacity-60" />
              <p className="font-medium">No {schema.title} entries recorded</p>
              <p className="text-[11px] text-devTextMuted/80 mt-1">Data pushed from the plugin will render here automatically.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-devBorder bg-devSurface/60 text-[10px] uppercase font-semibold text-devTextDim">
                  {schema.columns.map((col) => (
                    <th key={col.key} className="px-3 py-2 font-mono">{col.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-devBorder/60">
                {filteredEvents.map((evt, idx) => {
                  const isSelected = selectedIndex === idx;
                  return (
                    <tr
                      key={idx}
                      onClick={() => setSelectedIndex(idx)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-devAccent/15 border-l-4 border-devAccent text-devText' : 'hover:bg-devCardHover/60 text-devText'
                      }`}
                    >
                      {schema.columns.map((col) => {
                        const val = evt ? evt[col.key] : undefined;
                        let rendered: React.ReactNode = String(val ?? '');

                        if (val === undefined || val === null) {
                          rendered = <span className="text-devTextMuted/40 italic text-[11px]">—</span>;
                        } else if (col.type === 'timestamp') {
                          const d = new Date(val);
                          const isValid = (typeof val === 'number' || typeof val === 'string') && !isNaN(d.getTime());
                          rendered = isValid ? (
                            <span className="font-mono text-devTextDim">{d.toLocaleTimeString()}</span>
                          ) : (
                            <span className="text-devTextMuted/40 italic text-[11px]">—</span>
                          );
                        } else if (col.type === 'badge') {
                          rendered = (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-fuchsia-500/20 text-fuchsia-500 border border-fuchsia-500/30 font-mono">
                              {String(val)}
                            </span>
                          );
                        } else if (col.type === 'json') {
                          rendered = (
                            <span className="font-mono text-devTextDim truncate max-w-[150px] inline-block">
                              {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                            </span>
                          );
                        } else if (col.type === 'number') {
                          rendered = <span className="font-mono text-devText">{Number(val).toLocaleString()}</span>;
                        }

                        return (
                          <td key={col.key} className="px-3 py-2">
                            {rendered}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Right: Selected Event JSON Inspector */}
        <div className="w-1/2 flex flex-col bg-devSurface/40 overflow-y-auto p-4 select-text">
          {selectedEvent ? (
            <div className="space-y-3 flex-1 flex flex-col">
              <div className="flex items-center justify-between shrink-0">
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-devTextDim">
                  Event Payload Inspector
                </h3>
              </div>
              <div className="p-3 bg-devCodeBg rounded-lg border border-devBorder overflow-x-auto select-text flex-1">
                <JsonTree data={selectedEvent} defaultExpandedDepth={2} />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-devTextMuted text-xs">
              Select an item from the table to view the raw payload
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

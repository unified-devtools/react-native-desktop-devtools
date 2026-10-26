import { useState, useMemo } from 'react';
import { NetworkEntry, MockRule } from '../types';
import { Search, Globe, Copy, Check, Clock, Plus, Trash2, Sliders } from 'lucide-react';
import { JsonTree } from './JsonTree';

interface NetworkViewProps {
  requests: NetworkEntry[];
  mockRules: MockRule[];
  onAddMockRule: (rule: MockRule) => void;
  onRemoveMockRule: (id: string) => void;
  onToggleMockRule: (id: string) => void;
}

export const NetworkView: React.FC<NetworkViewProps> = ({
  requests,
  mockRules,
  onAddMockRule,
  onRemoveMockRule,
  onToggleMockRule,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReqId, setSelectedReqId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<'headers' | 'payload' | 'response' | 'mock'>('response');
  const [copied, setCopied] = useState(false);

  // New mock form state
  const [mockStatus, setMockStatus] = useState<number>(200);
  const [mockDelay, setMockDelay] = useState<number>(500);
  const [mockJson, setMockJson] = useState<string>('{\n  "mocked": true,\n  "data": {}\n}');

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return r.url.toLowerCase().includes(q) || r.method.toLowerCase().includes(q) || String(r.status).includes(q);
    });
  }, [requests, searchQuery]);

  const selectedRequest = useMemo(() => {
    return requests.find((r) => r.id === selectedReqId) || filteredRequests[0] || null;
  }, [requests, selectedReqId, filteredRequests]);

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusBadge = (status: number) => {
    if (status >= 200 && status < 300) {
      return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 font-mono">{status}</span>;
    }
    if (status >= 300 && status < 400) {
      return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-500 border border-sky-500/30 font-mono">{status}</span>;
    }
    if (status >= 400 && status < 500) {
      return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-500 border border-amber-500/30 font-mono">{status}</span>;
    }
    return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-500 border border-rose-500/30 font-mono">{status}</span>;
  };

  const handleCreateMockFromSelected = () => {
    if (!selectedRequest) return;
    const rule: MockRule = {
      id: 'mock_' + Date.now(),
      urlPattern: selectedRequest.url,
      method: selectedRequest.method,
      statusCode: mockStatus,
      delayMs: mockDelay,
      responseBody: mockJson,
      enabled: true,
    };
    onAddMockRule(rule);
    setDetailTab('mock');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-devBg overflow-hidden transition-colors duration-150">
      {/* Top Search & Controls Bar */}
      <div className="h-11 px-4 border-b border-devBorder bg-devSurface flex items-center justify-between space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-devTextMuted absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Filter requests by URL, method, status code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-devCard border border-devBorder rounded py-1 pl-8 pr-3 text-xs text-devText placeholder-devTextMuted focus:outline-none focus:border-devAccent"
          />
        </div>

        <div className="flex items-center space-x-2">
          {mockRules.length > 0 && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-fuchsia-500/20 text-fuchsia-500 border border-fuchsia-500/30 font-medium">
              {mockRules.filter((m) => m.enabled).length} active mock rule(s)
            </span>
          )}
        </div>
      </div>

      {/* Main Split Table & Inspector */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Pane: Requests Table */}
        <div className="w-1/2 border-r border-devBorder overflow-y-auto bg-devBg">
          {filteredRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-devTextMuted text-xs p-8 text-center">
              <Globe className="w-8 h-8 mb-2 stroke-[1.5] text-devTextMuted opacity-60" />
              <p className="font-medium">No network traffic captured yet</p>
              <p className="text-[11px] text-devTextMuted/80 mt-1">HTTP requests made via fetch or XMLHttpRequest in React Native will display here live.</p>
            </div>
          ) : (
            <div className="divide-y divide-devBorder/60">
              {filteredRequests.map((req) => {
                const isSelected = selectedRequest?.id === req.id;
                let parsedPath = req.url;
                try {
                  const u = new URL(req.url);
                  parsedPath = u.pathname + u.search;
                } catch {
                  // Keep as is
                }

                return (
                  <div
                    key={req.id}
                    onClick={() => setSelectedReqId(req.id)}
                    className={`px-3 py-2 text-xs flex items-center space-x-2 cursor-pointer font-mono transition-colors ${
                      isSelected
                        ? 'bg-devAccent/15 border-l-4 border-devAccent text-devText'
                        : 'hover:bg-devCardHover/60 text-devText'
                    }`}
                  >
                    <div>{getStatusBadge(req.status)}</div>
                    <span className="font-semibold text-devTextDim w-12 text-[11px]">{req.method}</span>
                    <span className="flex-1 truncate" title={req.url}>
                      {parsedPath}
                    </span>
                    {req.isMocked && (
                      <span className="px-1 py-0.5 rounded text-[9px] font-bold bg-fuchsia-500/20 text-fuchsia-500 border border-fuchsia-500/40">
                        MOCKED
                      </span>
                    )}
                    <span className="text-[10px] text-devTextMuted flex items-center">
                      <Clock className="w-2.5 h-2.5 mr-0.5 inline text-devTextMuted" />
                      {req.durationMs}ms
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Pane: Inspector & Mocking Engine */}
        <div className="w-1/2 flex flex-col bg-devSurface/40 overflow-hidden">
          {selectedRequest ? (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              {/* Request Header Summary */}
              <div className="px-4 py-2.5 border-b border-devBorder bg-devSurface flex items-center justify-between">
                <div className="flex items-center space-x-2 truncate">
                  {getStatusBadge(selectedRequest.status)}
                  <span className="font-bold text-xs text-devText">{selectedRequest.method}</span>
                  <span className="text-xs text-devTextDim truncate font-mono" title={selectedRequest.url}>
                    {selectedRequest.url}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => copyText(`curl -X ${selectedRequest.method} "${selectedRequest.url}"`)}
                    className="flex items-center space-x-1 px-2 py-1 rounded bg-devCard hover:bg-devCardHover text-devText text-[11px] border border-devBorder transition-colors"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    <span>cURL</span>
                  </button>
                </div>
              </div>

              {/* Sub-tabs */}
              <div className="flex items-center border-b border-devBorder px-4 bg-devSurface/60 space-x-4">
                {(['response', 'payload', 'headers', 'mock'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setDetailTab(tab)}
                    className={`py-2 text-xs font-medium capitalize border-b-2 transition-colors ${
                      detailTab === tab
                        ? 'border-devAccent text-devAccent font-semibold'
                        : 'border-transparent text-devTextMuted hover:text-devText'
                    }`}
                  >
                    {tab === 'mock' ? '🧪 Mock Override' : tab}
                  </button>
                ))}
              </div>

              {/* Tab Contents */}
              <div className="flex-1 overflow-y-auto p-4">
                {detailTab === 'response' && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] uppercase tracking-wider text-devTextDim font-semibold">Response Body</span>
                      <button
                        onClick={() => copyText(typeof selectedRequest.responseBody === 'object' ? JSON.stringify(selectedRequest.responseBody, null, 2) : String(selectedRequest.responseBody))}
                        className="text-[11px] text-devAccent hover:underline"
                      >
                        Copy Response
                      </button>
                    </div>
                    {typeof selectedRequest.responseBody === 'object' && selectedRequest.responseBody !== null ? (
                      <div className="p-3 bg-devCodeBg rounded-lg border border-devBorder overflow-x-auto select-text">
                        <JsonTree data={selectedRequest.responseBody} defaultExpandedDepth={2} />
                      </div>
                    ) : (
                      <pre className="p-3 bg-devCodeBg rounded-lg border border-devBorder text-xs font-mono text-emerald-400 overflow-x-auto whitespace-pre-wrap select-text">
                        {selectedRequest.responseBody !== undefined
                          ? String(selectedRequest.responseBody)
                          : '// No response body or empty payload'}
                      </pre>
                    )}
                  </div>
                )}

                {detailTab === 'payload' && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] uppercase tracking-wider text-devTextDim font-semibold">Request Body</span>
                    </div>
                    {typeof selectedRequest.requestBody === 'object' && selectedRequest.requestBody !== null ? (
                      <div className="p-3 bg-devCodeBg rounded-lg border border-devBorder overflow-x-auto select-text">
                        <JsonTree data={selectedRequest.requestBody} defaultExpandedDepth={2} />
                      </div>
                    ) : (
                      <pre className="p-3 bg-devCodeBg rounded-lg border border-devBorder text-xs font-mono text-devText overflow-x-auto whitespace-pre-wrap select-text">
                        {selectedRequest.requestBody !== undefined
                          ? String(selectedRequest.requestBody)
                          : '// No request payload (GET or body empty)'}
                      </pre>
                    )}
                  </div>
                )}

                {detailTab === 'headers' && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-[11px] uppercase tracking-wider text-devTextDim font-semibold mb-2">Response Headers</h4>
                      <div className="p-3 bg-devCodeBg rounded-lg border border-devBorder text-xs font-mono space-y-1">
                        {Object.entries(selectedRequest.responseHeaders || {}).map(([k, v]) => (
                          <div key={k} className="flex">
                            <span className="text-devTextMuted w-40 truncate">{k}:</span>
                            <span className="text-devText flex-1 break-all">{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-[11px] uppercase tracking-wider text-devTextDim font-semibold mb-2">Request Headers</h4>
                      <div className="p-3 bg-devCodeBg rounded-lg border border-devBorder text-xs font-mono space-y-1">
                        {Object.entries(selectedRequest.requestHeaders || {}).map(([k, v]) => (
                          <div key={k} className="flex">
                            <span className="text-devTextMuted w-40 truncate">{k}:</span>
                            <span className="text-devText flex-1 break-all">{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {detailTab === 'mock' && (
                  <div className="space-y-4">
                    <div className="p-3 rounded-lg bg-fuchsia-500/10 border border-fuchsia-500/30">
                      <h4 className="text-xs font-bold text-fuchsia-500 flex items-center mb-1">
                        <Sliders className="w-3.5 h-3.5 mr-1.5" />
                        Mock Network Response for this URL
                      </h4>
                      <p className="text-[11px] text-devTextMuted mb-3">
                        When enabled, React Native will intercept requests matching this URL and instantly return this synthetic response without contacting the real server.
                      </p>

                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="text-[10px] uppercase font-semibold text-devTextMuted block mb-1">
                            Status Code
                          </label>
                          <select
                            value={mockStatus}
                            onChange={(e) => setMockStatus(Number(e.target.value))}
                            className="w-full bg-devCard border border-devBorder rounded p-1.5 text-xs text-devText font-mono"
                          >
                            <option value={200}>200 OK</option>
                            <option value={201}>201 Created</option>
                            <option value={400}>400 Bad Request</option>
                            <option value={401}>401 Unauthorized</option>
                            <option value={403}>403 Forbidden</option>
                            <option value={404}>404 Not Found</option>
                            <option value={500}>500 Internal Server Error</option>
                            <option value={503}>503 Service Unavailable</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] uppercase font-semibold text-devTextMuted block mb-1">
                            Simulated Delay (ms)
                          </label>
                          <input
                            type="number"
                            value={mockDelay}
                            onChange={(e) => setMockDelay(Number(e.target.value))}
                            className="w-full bg-devCard border border-devBorder rounded p-1.5 text-xs text-devText font-mono"
                          />
                        </div>
                      </div>

                      <div className="mb-3">
                        <label className="text-[10px] uppercase font-semibold text-devTextMuted block mb-1">
                          Mock JSON Response Body
                        </label>
                        <textarea
                          rows={6}
                          value={mockJson}
                          onChange={(e) => setMockJson(e.target.value)}
                          className="w-full bg-devCodeBg border border-devBorder rounded p-2 text-xs text-emerald-500 font-mono focus:outline-none focus:border-fuchsia-500"
                        />
                      </div>

                      <button
                        onClick={handleCreateMockFromSelected}
                        className="w-full py-2 bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 text-white rounded font-medium text-xs shadow-md shadow-fuchsia-600/20 flex items-center justify-center space-x-1.5 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Save & Activate Mock Rule</span>
                      </button>
                    </div>

                    {/* Active Mock Rules List */}
                    <div>
                      <h4 className="text-[11px] uppercase tracking-wider text-devTextDim font-semibold mb-2">
                        Active Mock Rules ({mockRules.length})
                      </h4>
                      {mockRules.length === 0 ? (
                        <p className="text-xs text-devTextMuted italic">No mock rules active</p>
                      ) : (
                        <div className="space-y-2">
                          {mockRules.map((rule) => (
                            <div
                              key={rule.id}
                              className="p-2.5 rounded border border-devBorder bg-devCard flex items-center justify-between text-xs"
                            >
                              <div className="truncate flex-1 mr-2">
                                <div className="flex items-center space-x-2">
                                  <span className="font-bold text-devText">{rule.method}</span>
                                  <span className="text-fuchsia-500 font-mono font-semibold">{rule.statusCode}</span>
                                  <span className="text-[10px] text-devTextMuted">({rule.delayMs}ms)</span>
                                </div>
                                <div className="text-devTextMuted font-mono text-[11px] truncate">{rule.urlPattern}</div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => onToggleMockRule(rule.id)}
                                  className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                                    rule.enabled
                                      ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30'
                                      : 'bg-devBg text-devTextMuted border-devBorder'
                                  }`}
                                >
                                  {rule.enabled ? 'Active' : 'Off'}
                                </button>
                                <button
                                  onClick={() => onRemoveMockRule(rule.id)}
                                  className="text-devTextMuted hover:text-rose-500 p-1"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-devTextMuted text-xs">
              Select a request from the table to view details or create a mock
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

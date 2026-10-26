import { useState, useEffect, useCallback } from 'react';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import { Sidebar } from './components/Sidebar';
import { ConsoleView } from './components/ConsoleView';
import { NetworkView } from './components/NetworkView';
import { QueryView } from './components/QueryView';
import { CustomPluginView } from './components/CustomPluginView';
import { ThemeProvider } from './theme/ThemeContext';
import { 
  TabType, 
  DeviceInfo, 
  ConsoleEntry, 
  NetworkEntry, 
  MockRule, 
  QueryEntry, 
  CustomPluginSchema 
} from './types';

export function App() {
  const [currentTab, setCurrentTab] = useState<TabType>('logs');
  const [selectedCustomPluginId, setSelectedCustomPluginId] = useState<string | undefined>();
  const [isPaused, setIsPaused] = useState(false);

  // Connected Devices
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [activeDeviceId, setActiveDeviceId] = useState<string | undefined>();

  // Data Stores
  const [logs, setLogs] = useState<ConsoleEntry[]>([]);
  const [networkRequests, setNetworkRequests] = useState<NetworkEntry[]>([]);
  const [mockRules, setMockRules] = useState<MockRule[]>([]);
  const [queries, setQueries] = useState<QueryEntry[]>([]);
  const [customPlugins, setCustomPlugins] = useState<CustomPluginSchema[]>([]);
  const [customEvents, setCustomEvents] = useState<Record<string, any[]>>({});

  // Helper to send messages back to React Native
  const sendToMobile = useCallback(async (packet: any) => {
    try {
      await invoke('send_to_mobile', { message: JSON.stringify(packet) });
    } catch (err) {
      console.error('Failed to send to mobile device:', err);
    }
  }, []);

  // Sync active mock rules to React Native whenever they change
  useEffect(() => {
    sendToMobile({
      type: 'network:set_mocks',
      payload: mockRules.filter((m) => m.enabled),
    });
  }, [mockRules, sendToMobile]);

  // Listen to Tauri events from Rust WebSocket server
  useEffect(() => {
    // 1. Client Connected
    const unlistenConnect = listen<{ address: string; timestamp: number }>('client-connected', (event) => {
      const newDevice: DeviceInfo = {
        id: event.payload.address,
        name: 'React Native Client (' + event.payload.address + ')',
        platform: 'other',
        osVersion: 'Active',
        address: event.payload.address,
        connectedAt: event.payload.timestamp,
      };
      setDevices((prev) => {
        if (prev.some((d) => d.id === newDevice.id)) return prev;
        return [...prev, newDevice];
      });
      setActiveDeviceId(newDevice.id);
    });

    // 2. Client Disconnected
    const unlistenDisconnect = listen<{ address: string }>('client-disconnected', (event) => {
      setDevices((prev) => prev.filter((d) => d.id !== event.payload.address));
    });

    // 3. Inbound DevTools Messages from React Native
    const unlistenMessage = listen<{ from: string; data: string }>('devtools-message', (event) => {
      if (isPaused) return;

      try {
        const packet = JSON.parse(event.payload.data);

        // Handshake
        if (packet.type === 'client:handshake') {
          const { appName, platform, osVersion, deviceName, customPlugins: schemas } = packet.payload;
          setDevices((prev) =>
            prev.map((d) =>
              d.address === event.payload.from
                ? {
                    ...d,
                    name: deviceName || appName || d.name,
                    platform: platform || d.platform,
                    osVersion: osVersion || d.osVersion,
                  }
                : d
            )
          );
          if (schemas && Array.isArray(schemas)) {
            setCustomPlugins(schemas);
          }
          // Immediately sync active mock rules upon client handshake
          sendToMobile({
            type: 'network:set_mocks',
            payload: mockRules.filter((m) => m.enabled),
          });
        }

        // Console Log
        else if (packet.type === 'console:log') {
          const rawArgs = packet.payload?.args;
          const args = Array.isArray(rawArgs) ? rawArgs : (rawArgs !== undefined ? [rawArgs] : []);
          const entry: ConsoleEntry = {
            id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            level: packet.payload?.level || 'log',
            args,
            timestamp: packet.payload?.timestamp || Date.now(),
            stack: packet.payload?.stack,
          };
          setLogs((prev) => [entry, ...prev].slice(0, 5000));
        }

        // Network Request Initiated
        else if (packet.type === 'network:request') {
          const req = packet.payload;
          setNetworkRequests((prev) => {
            const exists = prev.find((r) => r.id === req.id);
            if (exists) return prev;
            const newEntry: NetworkEntry = {
              id: req.id,
              url: req.url,
              method: req.method || 'GET',
              status: 0,
              requestHeaders: req.headers || {},
              requestBody: req.body,
              responseHeaders: {},
              durationMs: 0,
              timestamp: req.timestamp || Date.now(),
              isMocked: req.isMocked,
            };
            return [newEntry, ...prev].slice(0, 1000);
          });
        }

        // Network Response Completed
        else if (packet.type === 'network:response') {
          const res = packet.payload;
          setNetworkRequests((prev) =>
            prev.map((r) =>
              r.id === res.id
                ? {
                    ...r,
                    status: res.status,
                    responseHeaders: res.headers || {},
                    responseBody: res.body,
                    durationMs: res.durationMs || 0,
                    isMocked: res.isMocked ?? r.isMocked,
                  }
                : r
            )
          );
        }

        // TanStack Query Cache Update
        else if (packet.type === 'query:update') {
          const q = packet.payload;
          setQueries((prev) => {
            const index = prev.findIndex((item) => item.key === q.key);
            if (index >= 0) {
              const updated = [...prev];
              updated[index] = { ...updated[index], ...q, updatedAt: Date.now() };
              return updated;
            }
            return [{ ...q, updatedAt: Date.now() }, ...prev];
          });
        }

        // Custom Plugin Event
        else if (packet.type === 'custom:event') {
          const { pluginId, event: customData } = packet.payload;
          setCustomEvents((prev) => ({
            ...prev,
            [pluginId]: [customData, ...(prev[pluginId] || [])].slice(0, 1000),
          }));
        }
      } catch (err) {
        console.error('Error parsing inbound devtools packet:', err);
      }
    });

    return () => {
      unlistenConnect.then((f) => f());
      unlistenDisconnect.then((f) => f());
      unlistenMessage.then((f) => f());
    };
  }, [isPaused]);

  // Actions
  const handleClearCurrent = () => {
    if (currentTab === 'logs') setLogs([]);
    if (currentTab === 'network') setNetworkRequests([]);
    if (currentTab === 'queries') setQueries([]);
    if (currentTab === 'custom' && selectedCustomPluginId) {
      setCustomEvents((prev) => ({ ...prev, [selectedCustomPluginId]: [] }));
    }
  };

  const handleAddMockRule = (rule: MockRule) => {
    setMockRules((prev) => [...prev, rule]);
  };

  const handleRemoveMockRule = (id: string) => {
    setMockRules((prev) => prev.filter((r) => r.id !== id));
  };

  const handleToggleMockRule = (id: string) => {
    setMockRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    );
  };

  const handleRefetchQuery = (queryKey: string) => {
    sendToMobile({ type: 'query:action', payload: { action: 'refetch', queryKey } });
  };

  const handleInvalidateQuery = (queryKey: string) => {
    sendToMobile({ type: 'query:action', payload: { action: 'invalidate', queryKey } });
  };

  const handleResetQuery = (queryKey: string) => {
    sendToMobile({ type: 'query:action', payload: { action: 'reset', queryKey } });
  };

  const handleRemoveQuery = (queryKey: string) => {
    sendToMobile({ type: 'query:action', payload: { action: 'remove', queryKey } });
    setQueries((prev) => prev.filter((q) => q.key !== queryKey));
  };

  const handleTriggerLoading = (queryKey: string) => {
    sendToMobile({ type: 'query:action', payload: { action: 'triggerLoading', queryKey } });
  };

  const handleTriggerError = (queryKey: string) => {
    sendToMobile({ type: 'query:action', payload: { action: 'triggerError', queryKey } });
  };

  const handleRefetchAllQueries = () => {
    sendToMobile({ type: 'query:action', payload: { action: 'refetchAll' } });
  };

  const handleClearAllQueries = () => {
    sendToMobile({ type: 'query:action', payload: { action: 'clearAll' } });
    setQueries([]);
  };

  const handleTriggerCustomAction = (pluginId: string, actionId: string) => {
    sendToMobile({ type: 'custom:action', payload: { pluginId, actionId } });
  };

  const activeCustomSchema = customPlugins.find((p) => p.id === selectedCustomPluginId);

  return (
    <ThemeProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-devBg text-devText select-none transition-colors duration-150">
        {/* Flipper-Style Left Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          selectedCustomPluginId={selectedCustomPluginId}
          onSelectCustomPlugin={setSelectedCustomPluginId}
          customPlugins={customPlugins}
          devices={devices}
          activeDeviceId={activeDeviceId}
          onSelectDevice={setActiveDeviceId}
          logsCount={logs.length}
          networkCount={networkRequests.length}
          queriesCount={queries.length}
          isPaused={isPaused}
          onTogglePause={() => setIsPaused(!isPaused)}
          onClearCurrent={handleClearCurrent}
        />

        {/* Main Workspace Area */}
        <main className="flex-1 flex flex-col h-full overflow-hidden">
          {currentTab === 'logs' && (
            <ConsoleView logs={logs} onClear={() => setLogs([])} />
          )}
          {currentTab === 'network' && (
            <NetworkView
              requests={networkRequests}
              mockRules={mockRules}
              onAddMockRule={handleAddMockRule}
              onRemoveMockRule={handleRemoveMockRule}
              onToggleMockRule={handleToggleMockRule}
            />
          )}
          {currentTab === 'queries' && (
            <QueryView
              queries={queries}
              onRefetchQuery={handleRefetchQuery}
              onInvalidateQuery={handleInvalidateQuery}
              onResetQuery={handleResetQuery}
              onRemoveQuery={handleRemoveQuery}
              onTriggerLoading={handleTriggerLoading}
              onTriggerError={handleTriggerError}
              onRefetchAll={handleRefetchAllQueries}
              onClearAll={handleClearAllQueries}
            />
          )}
          {currentTab === 'custom' && activeCustomSchema && (
            <CustomPluginView
              schema={activeCustomSchema}
              events={customEvents[activeCustomSchema.id] || []}
              onTriggerAction={handleTriggerCustomAction}
            />
          )}
        </main>
      </div>
    </ThemeProvider>
  );
}

export default App;

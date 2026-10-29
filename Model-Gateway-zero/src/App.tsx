import { useState, useEffect } from 'react';
import { Cpu, MessageSquare, Columns, Layers } from 'lucide-react';
import { GatewayView, useGateway } from './gateway';
import { TempTestChat } from './temp-test-chat';

type ViewMode = 'gateway' | 'chat' | 'split';

export function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const { availableModels, providers } = useGateway();

  useEffect(() => {
    const handleSwitchView = (e: any) => {
      if (e.detail?.viewMode) {
        setViewMode(e.detail.viewMode);
      }
    };
    window.addEventListener('gateway:switch-view', handleSwitchView);
    return () => window.removeEventListener('gateway:switch-view', handleSwitchView);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      {/* Top Application Bar */}
      <header
        style={{
          height: '52px',
          backgroundColor: '#0d1322',
          borderBottom: '1px solid #1e293b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          flexShrink: 0,
        }}
      >
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              backgroundColor: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 0 12px rgba(37, 99, 235, 0.4)',
            }}
          >
            <Cpu size={16} />
          </div>
          <span style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '-0.02em', color: '#f8fafc' }}>
            Model Gateway
          </span>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              backgroundColor: '#1e293b',
              color: '#94a3b8',
              padding: '2px 6px',
              borderRadius: '4px',
              border: '1px solid #334155',
            }}
          >
            Modular v1.0
          </span>
        </div>

        {/* View Mode Switcher */}
        <div
          style={{
            display: 'flex',
            backgroundColor: '#090d16',
            padding: '3px',
            borderRadius: '8px',
            border: '1px solid #1e293b',
          }}
        >
          <button
            type="button"
            onClick={() => setViewMode('gateway')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              backgroundColor: viewMode === 'gateway' ? '#2563eb' : 'transparent',
              color: viewMode === 'gateway' ? '#ffffff' : '#94a3b8',
              transition: 'all 0.15s ease',
            }}
          >
            <Cpu size={14} />
            <span>Gateway (/src/gateway)</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('split')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              backgroundColor: viewMode === 'split' ? '#2563eb' : 'transparent',
              color: viewMode === 'split' ? '#ffffff' : '#94a3b8',
              transition: 'all 0.15s ease',
            }}
          >
            <Columns size={14} />
            <span>Split View</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('chat')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              backgroundColor: viewMode === 'chat' ? '#2563eb' : 'transparent',
              color: viewMode === 'chat' ? '#ffffff' : '#94a3b8',
              transition: 'all 0.15s ease',
            }}
          >
            <MessageSquare size={14} />
            <span>Sandbox Chat (/src/temp-test-chat)</span>
          </button>
        </div>

        {/* Global Stats */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#94a3b8' }}>
            <Cpu size={13} color="#34d399" />
            <span>
              <strong style={{ color: '#f1f5f9' }}>{providers.length}</strong> Providers
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#94a3b8' }}>
            <Layers size={13} color="#60a5fa" />
            <span>
              <strong style={{ color: '#f1f5f9' }}>{availableModels.length}</strong> Models Ready
            </span>
          </div>
        </div>
      </header>

      {/* Main Workspace Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {viewMode === 'gateway' && (
          <div style={{ flex: 1, height: '100%' }}>
            <GatewayView />
          </div>
        )}

        {viewMode === 'chat' && (
          <div style={{ flex: 1, height: '100%' }}>
            <TempTestChat />
          </div>
        )}

        {viewMode === 'split' && (
          <>
            <div style={{ flex: 1, height: '100%', borderRight: '1px solid #1e293b' }}>
              <GatewayView />
            </div>
            <div style={{ flex: 1, height: '100%' }}>
              <TempTestChat />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

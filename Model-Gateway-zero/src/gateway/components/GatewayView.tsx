import React, { useState } from 'react';
import { ProvidersList } from './ProvidersList';
import { LocalGgufManager } from './LocalGgufManager';
import { useGateway } from '../hooks';
import { exportGatewayConfig, importGatewayConfig } from '../registry';
import { Cpu, Layers, ShieldCheck, Zap, Cloud, HardDrive, Download, Upload } from 'lucide-react';

export const GatewayView: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'providers' | 'local-gguf'>('providers');
  const {
    providers,
    availableModels,
    telemetryData,
    saveProvider,
    removeProvider,
    toggleProvider,
  } = useGateway();

  const handleExportConfig = () => {
    try {
      const json = exportGatewayConfig();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gateway-config-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(`Export failed: ${e.message}`);
    }
  };

  const handleImportConfig = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const res = await importGatewayConfig(text);
      alert(`Successfully imported ${res.count} providers!`);
    } catch (e: any) {
      alert(`Import failed: ${e.message}`);
    } finally {
      e.target.value = '';
    }
  };

  const activeProvidersCount = providers.filter((p) => p.enabled !== false).length;
  
  // Calculate average latency across providers with telemetry
  const latencies = Object.values(telemetryData)
    .map((t) => t.avgLatencyMs || t.lastPingMs)
    .filter((ms): ms is number => ms !== undefined && ms > 0);
  const avgLatency = latencies.length > 0 
    ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) 
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', overflowY: 'auto' }}>
      {/* Top Header Banner */}
      <div
        style={{
          padding: '20px 28px 16px',
          borderBottom: '1px solid var(--gw-border-subtle)',
          backgroundColor: 'var(--gw-bg-surface)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                display: 'inline-flex',
                padding: '8px',
                borderRadius: '8px',
                backgroundColor: 'rgba(37, 99, 235, 0.15)',
                color: '#60a5fa',
              }}
            >
              <Cpu size={22} />
            </span>
            <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: 'var(--gw-text-primary)' }}>
              Enterprise AI Provider Gateway
            </h1>
          </div>
          <p style={{ margin: '6px 0 0 42px', fontSize: '13px', color: 'var(--gw-text-muted)' }}>
            Universal gateway supporting Cloud APIs (OpenAI, Anthropic) & Native Offline GGUF Engine (node-llama-cpp).
          </p>
        </div>

        {/* Quick Stats Badges */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div
            style={{
              padding: '8px 14px',
              backgroundColor: 'var(--gw-bg-canvas)',
              border: '1px solid var(--gw-border-subtle)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <ShieldCheck size={16} color="#34d399" />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '11px', color: 'var(--gw-text-muted)' }}>Active Providers</span>
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--gw-text-primary)' }}>
                {activeProvidersCount} / {providers.length}
              </span>
            </div>
          </div>

          <div
            style={{
              padding: '8px 14px',
              backgroundColor: 'var(--gw-bg-canvas)',
              border: '1px solid var(--gw-border-subtle)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Layers size={16} color="#60a5fa" />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '11px', color: 'var(--gw-text-muted)' }}>Models Ready</span>
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--gw-text-primary)' }}>
                {availableModels.length}
              </span>
            </div>
          </div>

          <div
            style={{
              padding: '8px 14px',
              backgroundColor: 'var(--gw-bg-canvas)',
              border: '1px solid var(--gw-border-subtle)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Zap size={16} color="#f59e0b" />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '11px', color: 'var(--gw-text-muted)' }}>Latency Status</span>
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#f1f5f9' }}>
                {avgLatency ? `${avgLatency}ms avg` : 'Healthy'}
              </span>
            </div>
          </div>

          {/* 1-Click Gateway Backup Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '6px' }}>
            <button
              type="button"
              onClick={handleExportConfig}
              title="Export all configured providers and settings to a JSON file"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#1e293b',
                color: '#e2e8f0',
                border: '1px solid #334155',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Download size={14} />
              <span>Export Config</span>
            </button>

            <label
              title="Import providers and settings from a JSON file"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#1e293b',
                color: '#38bdf8',
                border: '1px solid #334155',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Upload size={14} />
              <span>Import Config</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportConfig}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        </div>
      </div>

      {/* Section Switcher Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          padding: '12px 28px',
          backgroundColor: '#090d16',
          borderBottom: '1px solid #1e293b',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveSection('providers')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            backgroundColor: activeSection === 'providers' ? '#2563eb' : '#1e293b',
            color: activeSection === 'providers' ? '#ffffff' : '#94a3b8',
            transition: 'all 0.15s ease',
          }}
        >
          <Cloud size={15} />
          <span>Cloud & Remote Providers</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('local-gguf')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            backgroundColor: activeSection === 'local-gguf' ? '#6366f1' : '#1e293b',
            color: activeSection === 'local-gguf' ? '#ffffff' : '#94a3b8',
            transition: 'all 0.15s ease',
          }}
        >
          <HardDrive size={15} />
          <span>Native Offline .gguf Engine</span>
          <span
            style={{
              fontSize: '10px',
              backgroundColor: activeSection === 'local-gguf' ? 'rgba(255,255,255,0.2)' : '#3730a3',
              color: '#ffffff',
              padding: '1px 6px',
              borderRadius: '4px',
            }}
          >
            Offline
          </span>
        </button>
      </div>

      {/* View Content */}
      {activeSection === 'providers' ? (
        <ProvidersList
          providers={providers}
          onSaveProvider={saveProvider}
          onRemoveProvider={removeProvider}
          onToggleProvider={toggleProvider}
        />
      ) : (
        <LocalGgufManager />
      )}
    </div>
  );
};
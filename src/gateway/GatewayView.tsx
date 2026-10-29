import React, { useState, useEffect } from 'react';
import { exportGatewayConfig, importGatewayConfig, getSavedProviders, saveProviders } from './registry';
import { gateway } from './sdk';
import type { ProviderConfig } from './types';

export interface GatewayViewProps {
  onClose?: () => void;
  className?: string;
}

export const GatewayView: React.FC<GatewayViewProps> = ({ onClose, className = '' }) => {
  const [providers, setProviders] = useState<ProviderConfig[]>([]);
  const [runningProcesses, setRunningProcesses] = useState<any[]>([]);
  const [notice, setNotice] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    try {
      setProviders(getSavedProviders());
    } catch {}
    gateway.getRunningProcesses().then(setRunningProcesses).catch(() => {});
  }, []);

  const handleExport = () => {
    try {
      const configJson = exportGatewayConfig();
      const blob = new Blob([configJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `zero-gateway-config-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setNotice({ text: 'Gateway configuration exported successfully.', type: 'success' });
    } catch (err: any) {
      setNotice({ text: `Export failed: ${err.message}`, type: 'error' });
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const res = await importGatewayConfig(text);
        setProviders(getSavedProviders());
        setNotice({ text: `Successfully imported ${res.count} provider(s)!`, type: 'success' });
      } catch (err: any) {
        setNotice({ text: `Import failed: ${err.message}`, type: 'error' });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className={`zero-gateway-view ${className}`} style={{ padding: '24px', fontFamily: 'inherit' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>Zero Model Gateway</h2>
          <p style={{ margin: '4px 0 0 0', opacity: 0.7, fontSize: '13px' }}>
            Unified model orchestration, local GGUF engine & agent tools
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={handleExport}
            style={{ padding: '8px 14px', borderRadius: '6px', cursor: 'pointer' }}
          >
            ⬇ Export Config
          </button>
          <label style={{ padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', border: '1px solid currentColor' }}>
            ⬆ Import Config
            <input type="file" accept=".json,application/json" onChange={handleImport} style={{ display: 'none' }} />
          </label>
          {onClose && (
            <button type="button" onClick={onClose} style={{ padding: '8px 14px', borderRadius: '6px', cursor: 'pointer' }}>
              Close
            </button>
          )}
        </div>
      </div>

      {notice && (
        <div
          style={{
            padding: '10px 16px',
            marginBottom: '16px',
            borderRadius: '6px',
            background: notice.type === 'success' ? '#10b98122' : '#ef444422',
            color: notice.type === 'success' ? '#10b981' : '#ef4444',
          }}
        >
          {notice.text}
        </div>
      )}

      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '15px', marginBottom: '12px' }}>Active Providers ({providers.length})</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {providers.map((p) => (
            <div
              key={p.id}
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <strong>{p.name}</strong> <span style={{ opacity: 0.6, fontSize: '12px' }}>({p.id})</span>
                <div style={{ fontSize: '12px', opacity: 0.6 }}>{p.baseUrl}</div>
              </div>
              <div style={{ fontSize: '12px', alignSelf: 'center' }}>
                {p.models?.length || 0} models configured
              </div>
            </div>
          ))}
        </div>
      </div>

      {runningProcesses.length > 0 && (
        <div>
          <h3 style={{ fontSize: '15px', marginBottom: '12px' }}>RAM Loaded Models ({runningProcesses.length})</h3>
          {runningProcesses.map((proc) => (
            <div
              key={proc.id}
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.1)',
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <strong>{proc.name}</strong>
                <div style={{ fontSize: '12px', opacity: 0.7 }}>Context: {proc.contextSize} · {proc.sizeFormatted}</div>
              </div>
              <div style={{ fontSize: '12px', color: '#10b981', alignSelf: 'center' }}>
                ● Active in RAM
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default GatewayView;

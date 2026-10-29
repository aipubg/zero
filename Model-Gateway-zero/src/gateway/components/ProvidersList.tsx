import React, { useState } from 'react';
import {
  Cpu,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  Brain,
  Image as ImageIcon,
  Power,
  RotateCw,
  Zap,
  Key,
  Shield,
  Sparkles,
} from 'lucide-react';
import type { ProviderConfig, GatewayModel } from '../types';
import { CustomProviderModal } from './CustomProviderModal';
import { pingProvider, getProviderApiKeys } from '../client';
import { telemetry } from '../telemetry';
import {
  deleteLocalGgufModelEverywhere,
  deleteAllLocalGgufModelsEverywhere,
} from '../registry';

function getCleanChipName(name?: string, id?: string): string {
  let clean = (name || id || '').trim();
  clean = clean.replace(/^\[Local GGUF\]\s*/i, '');
  clean = clean.replace(/\s*⚡\s*Guide(?:\s*\([^)]*\))?/gi, '');
  // Collapse duplicate quantization tags
  clean = clean.replace(
    /\s*\((?:Q[0-9]_[A-Za-z0-9_]+|F16|F32|BF16|FP16|FP32|TYPE_\d+)\)\s*\((?:Q[0-9]_[A-Za-z0-9_]+|F16|F32|BF16|FP16|FP32|TYPE_\d+)\)/gi,
    ' ($1)'
  );
  return clean || id || '';
}

interface ProvidersListProps {
  providers: ProviderConfig[];
  onSaveProvider: (provider: ProviderConfig) => void;
  onRemoveProvider: (id: string) => void;
  onToggleProvider: (id: string) => void;
}

export const ProvidersList: React.FC<ProvidersListProps> = ({
  providers,
  onSaveProvider,
  onRemoveProvider,
  onToggleProvider,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<ProviderConfig | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ [id: string]: { ok: boolean; message: string; latencyMs?: number } }>({});

  const handleOpenAdd = () => {
    setEditingProvider(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (provider: ProviderConfig) => {
    setEditingProvider(provider);
    setIsModalOpen(true);
  };

  const handleTestConnection = async (provider: ProviderConfig) => {
    setTestingId(provider.id);
    try {
      const pingRes = await pingProvider(provider);
      if (pingRes.ok) {
        setTestResult((prev) => ({
          ...prev,
          [provider.id]: {
            ok: true,
            latencyMs: pingRes.latencyMs,
            message: `Connected successfully! Latency: ${pingRes.latencyMs}ms (${provider.models.length} model${provider.models.length > 1 ? 's' : ''} ready).`,
          },
        }));
      } else {
        setTestResult((prev) => ({
          ...prev,
          [provider.id]: {
            ok: false,
            latencyMs: pingRes.latencyMs,
            message: pingRes.error || 'Connection failed',
          },
        }));
      }
    } catch (e: any) {
      setTestResult((prev) => ({
        ...prev,
        [provider.id]: {
          ok: false,
          message: e.message || 'Connection failed',
        },
      }));
    } finally {
      setTestingId(null);
    }
  };

  const handleDeleteModelFromDisk = async (_provider: ProviderConfig, model: GatewayModel) => {
    if (
      !confirm(
        `Are you sure you want to permanently delete "${model.name}" (.gguf binary & manifest) from disk?`
      )
    ) {
      return;
    }

    try {
      await deleteLocalGgufModelEverywhere(model.id);
    } catch (err: any) {
      alert(`Deletion error: ${err.message}`);
    }
  };

  return (
    <div className="gw-container">
      {/* Navigation Header */}
      <div className="gw-nav-section">
        <span className="gw-nav-icon">
          <Cpu size={16} />
        </span>
        <span>Providers</span>
      </div>

      {/* Exact Custom Provider Entry Row */}
      <div className="gw-provider-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: '#0e1117', border: '1px solid #1e2430', borderRadius: '8px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <Sparkles size={16} color="#94a3b8" style={{ marginTop: '3px' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '15px', fontWeight: 600, color: '#f8fafc' }}>Custom provider</span>
              <span style={{ fontSize: '10px', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', background: '#1e293b', color: '#94a3b8', border: '1px solid #334155' }}>CUSTOM</span>
            </div>
            <span style={{ fontSize: '13px', color: '#64748b' }}>Add a custom provider by base URL.</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            padding: '6px 12px',
            borderRadius: '6px',
            transition: 'color 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#f8fafc')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
        >
          <span>+ Connect</span>
        </button>
      </div>

      {/* Configured Providers Section */}
      <div className="gw-configured-section">
        <div className="gw-configured-header">
          Configured Providers ({providers.length})
        </div>

        {providers.length === 0 ? (
          <div
            style={{
              padding: '28px',
              textAlign: 'center',
              color: 'var(--gw-text-muted)',
              border: '1px dashed var(--gw-border-subtle)',
              borderRadius: '12px',
              fontSize: '13px',
            }}
          >
            No providers configured yet. Click <strong>+ Connect</strong> above to add your first AI provider!
          </div>
        ) : (
          providers.map((p) => {
            const result = testResult[p.id];
            const t = telemetry.get(p.id);
            const keys = getProviderApiKeys(p);
            const chatModels = p.models.filter((m) => m.type !== 'embedding');

            return (
              <div key={p.id} className="gw-provider-card">
                <div className="gw-provider-card-top">
                  <div className="gw-provider-meta">
                    <span
                      className={`gw-status-indicator ${p.enabled ? (t.status === 'error' ? 'error' : t.status === 'rate-limited' ? 'rate-limited' : '') : 'disabled'}`}
                      title={p.enabled ? `Status: ${t.status}` : 'Disabled'}
                    />
                    <span className="gw-provider-name">{p.name}</span>
                    <span className="gw-provider-id-tag">{p.id}</span>
                    <span
                      style={{
                        fontSize: '11px',
                        color: 'var(--gw-text-muted)',
                        backgroundColor: 'var(--gw-bg-surface-elevated)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                      }}
                    >
                      {p.apiType || 'openai-compatible'}
                    </span>

                    {/* Latency badge */}
                    {t.lastPingMs !== undefined && (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 3,
                          fontSize: '11px',
                          color: '#34d399',
                          backgroundColor: 'rgba(16, 185, 129, 0.1)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontWeight: 600,
                        }}
                      >
                        <Zap size={10} />
                        {t.lastPingMs}ms
                      </span>
                    )}

                    {/* Key pool badge */}
                    {keys.length > 1 && (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 3,
                          fontSize: '11px',
                          color: '#60a5fa',
                          backgroundColor: 'rgba(37, 99, 235, 0.12)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontWeight: 600,
                        }}
                        title={`Key Pool active: ${keys.length} keys loaded with automatic 429 failover`}
                      >
                        <Key size={10} />
                        {keys.length} Keys Pool
                      </span>
                    )}

                    {/* Fallback Model badge */}
                    {p.fallbackModelId && (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 3,
                          fontSize: '11px',
                          color: '#f59e0b',
                          backgroundColor: 'rgba(245, 158, 11, 0.12)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontWeight: 600,
                        }}
                        title={`Fallback enabled: fails over to ${p.fallbackModelId}`}
                      >
                        <Shield size={10} />
                        Fallback: {p.fallbackModelId}
                      </span>
                    )}
                  </div>

                  <div className="gw-provider-actions">
                    <button
                      type="button"
                      className="gw-action-pill-btn"
                      onClick={() => handleTestConnection(p)}
                      disabled={testingId === p.id}
                      title="Test connection and latency"
                    >
                      <RotateCw
                        size={12}
                        className={testingId === p.id ? 'gw-spin' : ''}
                      />
                      <span>{testingId === p.id ? 'Testing...' : 'Test'}</span>
                    </button>

                    <button
                      type="button"
                      className="gw-icon-btn"
                      onClick={() => onToggleProvider(p.id)}
                      title={p.enabled ? 'Disable provider' : 'Enable provider'}
                      style={{ color: p.enabled ? '#34d399' : '#64748b' }}
                    >
                      <Power size={15} />
                    </button>

                    <button
                      type="button"
                      className="gw-icon-btn"
                      onClick={() => handleOpenEdit(p)}
                      title="Edit provider configuration"
                    >
                      <Edit2 size={15} />
                    </button>

                    <button
                      type="button"
                      className="gw-trash-btn"
                      onClick={async () => {
                        if (confirm(`Are you sure you want to delete provider "${p.name}"?`)) {
                          if (p.id === 'local-gguf-engine' || p.isLocalEngine || p.apiType === 'local-gguf') {
                            await deleteAllLocalGgufModelsEverywhere();
                          } else {
                            onRemoveProvider(p.id);
                          }
                        }
                      }}
                      title="Delete provider"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Base URL and Details */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontSize: '12px',
                    color: 'var(--gw-text-muted)',
                    fontFamily: 'var(--gw-font-mono)',
                    flexWrap: 'wrap',
                  }}
                >
                  <span style={{ color: '#60a5fa' }}>{p.baseUrl}</span>
                  {keys.length > 0 ? (
                    <span style={{ color: 'var(--gw-text-muted)' }}>
                      • Auth: {keys.length} Key{keys.length > 1 ? 's' : ''} (Pool)
                    </span>
                  ) : (
                    <span style={{ color: 'var(--gw-text-disabled)' }}>• Auth: None (Header/Free)</span>
                  )}
                  {p.headers && p.headers.length > 0 && (
                    <span>• {p.headers.length} custom header{p.headers.length > 1 ? 's' : ''}</span>
                  )}
                  {t.totalRequests > 0 && (
                    <span style={{ color: '#94a3b8' }}>
                      • Requests: {t.successfulRequests}/{t.totalRequests}
                    </span>
                  )}
                </div>

                {/* Connectivity test feedback banner */}
                {result && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '12px',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      backgroundColor: result.ok
                        ? 'rgba(16, 185, 129, 0.1)'
                        : 'rgba(239, 68, 68, 0.1)',
                      color: result.ok ? '#34d399' : '#f87171',
                      border: `1px solid ${result.ok ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
                    }}
                  >
                    {result.ok ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                    <span>{result.message}</span>
                  </div>
                )}

                {/* Registered Models List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--gw-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Registered Models ({p.models.length}) • {chatModels.length} Chat Ready
                    </span>
                  </div>
                  <div className="gw-models-chip-list">
                    {p.models.map((m) => {
                      const isNonChat = m.type === 'embedding' || m.capabilities.embedding;
                      const isOffline = p.isLocalEngine || p.apiType === 'local-gguf' || m.isLocal;

                      return (
                        <div key={m.id} className={`gw-model-chip ${isNonChat ? 'embedding-chip' : ''}`}>
                          <span>{getCleanChipName(m.name, m.id)}</span>
                          {isNonChat && (
                            <span className="gw-chip-badge gw-chip-embedding" title="Embedding Model">
                              EMBEDDING
                            </span>
                          )}
                          {m.capabilities.reasoning && (
                            <span className="gw-chip-badge gw-chip-reasoning" title="Supports Reasoning Tokens">
                              <Brain size={10} style={{ display: 'inline', marginRight: 2 }} />
                              R
                            </span>
                          )}
                          {m.capabilities.image && (
                            <span className="gw-chip-badge gw-chip-image" title="Supports Vision / Images">
                              <ImageIcon size={10} style={{ display: 'inline', marginRight: 2 }} />
                              Vision
                            </span>
                          )}
                          {isOffline && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteModelFromDisk(p, m);
                              }}
                              title="Permanently delete from disk"
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#f87171',
                                cursor: 'pointer',
                                padding: '0 2px',
                                marginLeft: '5px',
                                fontSize: '11px',
                                fontWeight: 700,
                              }}
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Dialog */}
      <CustomProviderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={onSaveProvider}
        initialProvider={editingProvider}
      />
    </div>
  );
};
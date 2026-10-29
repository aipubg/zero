import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  X,
  Sparkles,
  Trash2,
  Plus,
  RotateCcw,
  Search,
} from 'lucide-react';
import type { CustomHeader, GatewayModel, ProviderConfig, ProviderApiType } from '../types';
import { fetchModelsFromBaseUrl } from '../client';

interface CustomProviderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (provider: ProviderConfig) => void;
  initialProvider?: ProviderConfig | null;
}

export const CustomProviderModal: React.FC<CustomProviderModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialProvider,
}) => {
  const [providerId, setProviderId] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [providerApi, setProviderApi] = useState<ProviderApiType>('openai-compatible');
  const [baseUrl, setBaseUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [fallbackModelId, setFallbackModelId] = useState<string>('');

  const [models, setModels] = useState<GatewayModel[]>([
    { id: '', name: '', capabilities: { reasoning: false, image: false }, type: 'chat' },
  ]);

  const [headers, setHeaders] = useState<CustomHeader[]>([]);

  // Inline "Fetch models" selection box states
  const [detectedModels, setDetectedModels] = useState<GatewayModel[]>([]);
  const [selectedModelIds, setSelectedModelIds] = useState<Set<string>>(new Set());
  const [isSelectionPanelOpen, setIsSelectionPanelOpen] = useState(false);
  const [modelSearchQuery, setModelSearchQuery] = useState('');
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [idError, setIdError] = useState<string | null>(null);
  const lastFetchedKeyRef = useRef<string>('');

  // Initialize form when opened or when initialProvider changes
  useEffect(() => {
    if (initialProvider) {
      setProviderId(initialProvider.id);
      setDisplayName(initialProvider.name);
      setProviderApi(initialProvider.apiType || 'openai-compatible');
      setBaseUrl(initialProvider.baseUrl);
      setApiKey(initialProvider.apiKey || (initialProvider.apiKeys ? initialProvider.apiKeys.join(', ') : ''));
      setFallbackModelId(initialProvider.fallbackModelId || '');
      setModels(
        initialProvider.models.length > 0
          ? initialProvider.models
          : [{ id: '', name: '', capabilities: { reasoning: false, image: false }, type: 'chat' }]
      );
      setHeaders(initialProvider.headers || []);
    } else {
      setProviderId('');
      setDisplayName('');
      setProviderApi('openai-compatible');
      setBaseUrl('');
      setApiKey('');
      setFallbackModelId('');
      setModels([
        { id: '', name: '', capabilities: { reasoning: false, image: false }, type: 'chat' },
      ]);
      setHeaders([]);
    }
    setDetectedModels([]);
    setSelectedModelIds(new Set());
    setIsSelectionPanelOpen(false);
    setModelSearchQuery('');
    setIdError(null);
    lastFetchedKeyRef.current = '';
  }, [initialProvider, isOpen]);

  // Debounced Auto-Detection: fetch models automatically when user enters Base URL (and API key)
  useEffect(() => {
    if (!isOpen) return;
    const cleanUrl = baseUrl.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) return;
    if (cleanUrl.length < 10) return;

    const signature = `${cleanUrl}::${apiKey.trim()}`;
    if (lastFetchedKeyRef.current === signature) return;

    const timer = setTimeout(async () => {
      lastFetchedKeyRef.current = signature;
      setIsFetchingModels(true);
      try {
        const activeKey = apiKey.trim().split(',')[0]?.trim() || '';
        const remote = await fetchModelsFromBaseUrl(cleanUrl, activeKey, headers);
        if (remote && remote.length > 0) {
          setDetectedModels(remote);
          setSelectedModelIds(new Set(remote.map((m) => m.id)));
          setIsSelectionPanelOpen(true);
        }
      } catch (err: any) {
        console.debug('[Auto-Detect] Model fetch in background:', err.message);
      } finally {
        setIsFetchingModels(false);
      }
    }, 700);

    return () => clearTimeout(timer);
  }, [baseUrl, apiKey, isOpen]);

  const validateId = (val: string): boolean => {
    if (!val.trim()) {
      setIdError('Provider ID cannot be empty');
      return false;
    }
    if (!/^[a-z0-9_-]+$/i.test(val.trim())) {
      setIdError('Provider ID can only contain letters, numbers, hyphens, or underscores');
      return false;
    }
    setIdError(null);
    return true;
  };

  const handleAddModel = () => {
    setModels((prev) => [
      ...prev,
      { id: '', name: '', capabilities: { reasoning: false, image: false }, type: 'chat' },
    ]);
  };

  const handleUpdateModel = (index: number, field: keyof GatewayModel, val: any) => {
    setModels((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      return next;
    });
  };

  const handleRemoveModel = (index: number) => {
    setModels((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : []));
  };

  const handleToggleReasoning = (index: number) => {
    setModels((prev) => {
      const next = [...prev];
      const curr = next[index].capabilities.reasoning;
      next[index] = {
        ...next[index],
        capabilities: { ...next[index].capabilities, reasoning: !curr },
      };
      return next;
    });
  };

  const handleToggleImage = (index: number) => {
    setModels((prev) => {
      const next = [...prev];
      const curr = next[index].capabilities.image;
      next[index] = {
        ...next[index],
        capabilities: { ...next[index].capabilities, image: !curr },
      };
      return next;
    });
  };

  const handleToggleReasoningForAll = () => {
    const anyOff = models.some((m) => !m.capabilities.reasoning);
    setModels((prev) =>
      prev.map((m) => ({
        ...m,
        capabilities: { ...m.capabilities, reasoning: anyOff },
      }))
    );
  };

  const handleToggleImageForAll = () => {
    const anyOff = models.some((m) => !m.capabilities.image);
    setModels((prev) =>
      prev.map((m) => ({
        ...m,
        capabilities: { ...m.capabilities, image: anyOff },
      }))
    );
  };

  // Fetch models from endpoint
  const handleFetchModels = async () => {
    if (!baseUrl.trim()) {
      alert('Please enter Base URL first before fetching models.');
      return;
    }
    setIsFetchingModels(true);
    try {
      const activeKey = apiKey.trim().split(',')[0]?.trim() || '';
      const remote = await fetchModelsFromBaseUrl(baseUrl.trim(), activeKey, headers);
      if (remote.length > 0) {
        setDetectedModels(remote);
        setSelectedModelIds(new Set(remote.map((m) => m.id)));
        setIsSelectionPanelOpen(true);
        lastFetchedKeyRef.current = `${baseUrl.trim()}::${apiKey.trim()}`;
      } else {
        alert('No models returned from provider endpoint.');
      }
    } catch (err: any) {
      alert(`Fetch models error: ${err.message || 'Unable to fetch models'}`);
    } finally {
      setIsFetchingModels(false);
    }
  };

  const handleSelectAll = () => {
    setSelectedModelIds(new Set(detectedModels.map((m) => m.id)));
  };

  const handleDeselectAll = () => {
    setSelectedModelIds(new Set());
  };

  const toggleModelCheck = (id: string) => {
    setSelectedModelIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleAddSelectedModels = () => {
    const selected = detectedModels.filter((m) => selectedModelIds.has(m.id));
    if (selected.length === 0) return;

    setModels((prev) => {
      const currentValid = prev.filter((m) => m.id.trim() !== '');
      const existingIds = new Set(currentValid.map((m) => m.id));

      const newToAdd = selected
        .filter((m) => !existingIds.has(m.id))
        .map((m) => ({
          id: m.id,
          name: m.id,
          capabilities: m.capabilities,
          type: m.type,
        }));

      return [...currentValid, ...newToAdd];
    });

    setIsSelectionPanelOpen(false);
  };

  const filteredDetectedModels = detectedModels.filter((m) => {
    return (
      m.id.toLowerCase().includes(modelSearchQuery.toLowerCase()) ||
      (m.name && m.name.toLowerCase().includes(modelSearchQuery.toLowerCase()))
    );
  });

  const handleAddHeader = () => {
    setHeaders((prev) => [...prev, { key: '', value: '' }]);
  };

  const handleUpdateHeader = (index: number, field: 'key' | 'value', val: string) => {
    setHeaders((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      return next;
    });
  };

  const handleRemoveHeader = (index: number) => {
    setHeaders((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateId(providerId)) return;

    if (!baseUrl.trim()) {
      alert('Base URL is required.');
      return;
    }

    const validModels = models.filter((m) => m.id.trim() !== '');
    if (validModels.length === 0) {
      alert('Please add at least one model ID.');
      return;
    }

    const cleanedHeaders = headers.filter((h) => h.key.trim() !== '');
    const cleanKeys = apiKey
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);

    const isOffline =
      initialProvider?.id === 'local-gguf-engine' ||
      initialProvider?.isLocalEngine ||
      providerApi === 'local-gguf';

    const newProvider: ProviderConfig = {
      id: providerId.trim(),
      name: displayName.trim() || providerId.trim(),
      apiType: providerApi,
      baseUrl: baseUrl.trim(),
      apiKey: cleanKeys[0] || undefined,
      apiKeys: cleanKeys.length > 0 ? cleanKeys : undefined,
      fallbackModelId: fallbackModelId.trim() || undefined,
      models: validModels.map((m) => ({
        ...m,
        id: m.id.trim(),
        name: m.name.trim() || m.id.trim(),
        capabilities: m.capabilities,
        type: m.type,
      })),
      headers: cleanedHeaders,
      isCustom: initialProvider ? Boolean(initialProvider.isCustom) : true,
      isLocalEngine: isOffline,
      enabled: initialProvider ? initialProvider.enabled : true,
      createdAt: initialProvider?.createdAt || Date.now(),
    };

    onSave(newProvider);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.78)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '720px',
          maxHeight: '92vh',
          backgroundColor: '#111318',
          border: '1px solid #1e222d',
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
          overflow: 'hidden',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div
          style={{
            padding: '16px 20px 12px 20px',
            borderBottom: '1px solid #1a1e28',
            backgroundColor: '#111318',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#9ca3af',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '2px',
                }}
              >
                <ArrowLeft size={16} />
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={16} color="#cbd5e1" />
                <span style={{ fontSize: '15px', fontWeight: 600, color: '#f8fafc' }}>
                  Custom provider
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#9ca3af',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '2px',
              }}
            >
              <X size={16} />
            </button>
          </div>

          <div style={{ marginTop: '8px', marginLeft: '28px', fontSize: '13px', color: '#6b7280' }}>
            Configure a custom provider.{' '}
            <span style={{ color: '#9ca3af', textDecoration: 'underline', cursor: 'pointer' }}>
              See the provider config docs.
            </span>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <form
          onSubmit={handleSubmit}
          style={{
            overflowY: 'auto',
            padding: '20px 24px 28px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
          }}
        >
          {/* Provider ID */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#d1d5db', marginBottom: '6px' }}>
              Provider ID
            </label>
            <input
              type="text"
              value={providerId}
              onChange={(e) => {
                setProviderId(e.target.value);
                validateId(e.target.value);
              }}
              disabled={Boolean(initialProvider)}
              placeholder="myprovider"
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: '#161922',
                border: idError ? '1px solid #ef4444' : '1px solid #282f3e',
                borderRadius: '4px',
                color: '#f8fafc',
                fontSize: '13px',
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
            {idError ? (
              <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                {idError}
              </span>
            ) : (
              <span style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                Lowercase letters, numbers, hyphens, or underscores
              </span>
            )}
          </div>

          {/* Display Name */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#d1d5db', marginBottom: '6px' }}>
              Display name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="My AI Provider"
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: '#161922',
                border: '1px solid #282f3e',
                borderRadius: '4px',
                color: '#f8fafc',
                fontSize: '13px',
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
          </div>

          {/* Provider API */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#d1d5db', marginBottom: '6px' }}>
              Provider API
            </label>
            <select
              value={providerApi}
              onChange={(e) => setProviderApi(e.target.value as any)}
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: '#161922',
                border: '1px solid #282f3e',
                borderRadius: '4px',
                color: '#f8fafc',
                fontSize: '13px',
                boxSizing: 'border-box',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="openai-compatible">OpenAI Compatible</option>
              <option value="anthropic">Anthropic</option>
              <option value="local-gguf">Local GGUF</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          {/* Base URL */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#d1d5db', marginBottom: '6px' }}>
              Base URL
            </label>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://api.myprovider.com/v1"
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: '#161922',
                border: '1px solid #282f3e',
                borderRadius: '4px',
                color: '#f8fafc',
                fontSize: '13px',
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
          </div>

          {/* API Key */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#d1d5db', marginBottom: '6px' }}>
              API key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="API key"
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: '#161922',
                border: '1px solid #282f3e',
                borderRadius: '4px',
                color: '#f8fafc',
                fontSize: '13px',
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
            <span style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
              Optional. Leave empty if you manage auth via headers.
            </span>
          </div>

          {/* Models Section */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0' }}>Models</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button
                  type="button"
                  onClick={handleFetchModels}
                  disabled={isFetchingModels || !baseUrl.trim()}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#9ca3af',
                    fontSize: '13px',
                    cursor: baseUrl.trim() ? 'pointer' : 'default',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: 0,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#f8fafc')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}
                >
                  <RotateCcw size={12} className={isFetchingModels ? 'animate-spin' : ''} />
                  <span>{isFetchingModels ? 'Fetching...' : '↹ Fetch models'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleToggleReasoningForAll}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#9ca3af',
                    fontSize: '13px',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#f8fafc')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}
                >
                  Toggle reasoning for all
                </button>

                <button
                  type="button"
                  onClick={handleToggleImageForAll}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#9ca3af',
                    fontSize: '13px',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#f8fafc')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}
                >
                  Toggle image for all
                </button>
              </div>
            </div>

            {/* Individual Model Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {models.map((m, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: '#131620',
                    border: '1px solid #222838',
                    borderRadius: '6px',
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>
                        ID
                      </label>
                      <input
                        type="text"
                        value={m.id}
                        onChange={(e) => handleUpdateModel(idx, 'id', e.target.value)}
                        placeholder="model-id"
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          backgroundColor: '#181c26',
                          border: '1px solid #262c3c',
                          borderRadius: '4px',
                          color: '#f8fafc',
                          fontSize: '12px',
                          boxSizing: 'border-box',
                          outline: 'none',
                        }}
                      />
                    </div>

                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>
                        Name
                      </label>
                      <input
                        type="text"
                        value={m.name}
                        onChange={(e) => handleUpdateModel(idx, 'name', e.target.value)}
                        placeholder="Display Name"
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          backgroundColor: '#181c26',
                          border: '1px solid #262c3c',
                          borderRadius: '4px',
                          color: '#f8fafc',
                          fontSize: '12px',
                          boxSizing: 'border-box',
                          outline: 'none',
                        }}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveModel(idx)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#6b7280',
                        cursor: 'pointer',
                        padding: '6px',
                        marginTop: '20px',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#6b7280')}
                      title="Remove model"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '12px',
                        color: '#cbd5e1',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(m.capabilities.reasoning)}
                        onChange={() => handleToggleReasoning(idx)}
                        style={{ accentColor: '#38bdf8', cursor: 'pointer' }}
                      />
                      <span>Reasoning</span>
                    </label>

                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '12px',
                        color: '#cbd5e1',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(m.capabilities.image)}
                        onChange={() => handleToggleImage(idx)}
                        style={{ accentColor: '#38bdf8', cursor: 'pointer' }}
                      />
                      <span>Image</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>

            {/* + Add Model Button */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
              <button
                type="button"
                onClick={handleAddModel}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#9ca3af',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 8px',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#f8fafc')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}
              >
                <Plus size={14} />
                <span>Add model</span>
              </button>
            </div>

            {/* Inline Fetch Models Panel (Image 4 & 5) */}
            {isSelectionPanelOpen && (
              <div
                style={{
                  backgroundColor: '#141414',
                  border: '1px solid #262626',
                  borderRadius: '6px',
                  padding: '16px',
                  marginTop: '12px',
                  marginBottom: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#f3f4f6' }}>
                    {detectedModels.length} models found
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#9ca3af',
                        fontSize: '13px',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#f3f4f6')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}
                    >
                      Select all
                    </button>
                    <button
                      type="button"
                      onClick={handleDeselectAll}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#9ca3af',
                        fontSize: '13px',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#f3f4f6')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}
                    >
                      Deselect all
                    </button>
                  </div>
                </div>

                {/* Search models input */}
                <div>
                  <input
                    type="text"
                    value={modelSearchQuery}
                    onChange={(e) => setModelSearchQuery(e.target.value)}
                    placeholder="Search models..."
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: '#1a1a1a',
                      border: '1px solid #282828',
                      borderRadius: '4px',
                      color: '#ffffff',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  />
                </div>

                {/* Scrollable Model Checkbox List */}
                <div
                  style={{
                    maxHeight: '260px',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    paddingRight: '6px',
                  }}
                  className="custom-gateway-scrollbar"
                >
                  {filteredDetectedModels.map((m) => {
                    const isChecked = selectedModelIds.has(m.id);
                    return (
                      <label
                        key={m.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '5px 2px',
                          fontSize: '13px',
                          color: '#e2e8f0',
                          cursor: 'pointer',
                          userSelect: 'none',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleModelCheck(m.id)}
                          style={{
                            accentColor: '#2563eb',
                            width: '15px',
                            height: '15px',
                            cursor: 'pointer',
                          }}
                        />
                        <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', fontSize: '13px' }}>
                          {m.id}
                        </span>
                      </label>
                    );
                  })}
                  {filteredDetectedModels.length === 0 && (
                    <div style={{ color: '#6b7280', fontSize: '12px', padding: '12px 0', textAlign: 'center' }}>
                      No models matching "{modelSearchQuery}"
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '6px' }}>
                  <button
                    type="button"
                    onClick={handleAddSelectedModels}
                    style={{
                      backgroundColor: '#21759b',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '8px 16px',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1d6788')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#21759b')}
                  >
                    Add {selectedModelIds.size} model(s)
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsSelectionPanelOpen(false)}
                    style={{
                      backgroundColor: 'transparent',
                      color: '#9ca3af',
                      border: 'none',
                      fontSize: '13px',
                      cursor: 'pointer',
                      padding: '8px 8px',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Headers (optional) Section */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#d1d5db', marginBottom: '8px' }}>
              Headers (optional)
            </label>

            {headers.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '8px' }}>
                {headers.map((h, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                      type="text"
                      value={h.key}
                      onChange={(e) => handleUpdateHeader(idx, 'key', e.target.value)}
                      placeholder="Header-Name"
                      style={{
                        flex: 1,
                        padding: '8px 10px',
                        backgroundColor: '#161922',
                        border: '1px solid #282f3e',
                        borderRadius: '4px',
                        color: '#f8fafc',
                        fontSize: '13px',
                        boxSizing: 'border-box',
                        outline: 'none',
                      }}
                    />
                    <input
                      type="text"
                      value={h.value}
                      onChange={(e) => handleUpdateHeader(idx, 'value', e.target.value)}
                      placeholder="value"
                      style={{
                        flex: 1,
                        padding: '8px 10px',
                        backgroundColor: '#161922',
                        border: '1px solid #282f3e',
                        borderRadius: '4px',
                        color: '#f8fafc',
                        fontSize: '13px',
                        boxSizing: 'border-box',
                        outline: 'none',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveHeader(idx)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#6b7280',
                        cursor: 'pointer',
                        padding: '6px',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#6b7280')}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '6px' }}>
              <button
                type="button"
                onClick={handleAddHeader}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#9ca3af',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 8px',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#f8fafc')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}
              >
                <Plus size={14} />
                <span>Add header</span>
              </button>
            </div>
          </div>

          {/* Submit Button (Image 3) */}
          <div style={{ marginTop: '8px' }}>
            <button
              type="submit"
              style={{
                width: '100%',
                backgroundColor: '#21759b',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '12px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1a6180')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#21759b')}
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

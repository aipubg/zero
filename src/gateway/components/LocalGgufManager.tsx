import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  HardDrive,
  Download,
  Upload,
  RefreshCw,
  Trash2,
  Cpu,
  Zap,
  AlertCircle,
  FolderInput,
  Search,
  CheckCircle2,
  XCircle,
  Loader2,
  Terminal,
  FileText,
  Sparkles,
  FileCode,
  MessageSquare,
  Play,
  Edit2,
} from 'lucide-react';
import type { GatewayModel } from '../types';
import { syncLocalGgufModels, deleteLocalGgufModelEverywhere } from '../registry';

interface LocalGgufManagerProps {
  onModelsUpdated?: (models: GatewayModel[]) => void;
}

interface ScannedModel {
  id: string;
  name: string;
  filename: string;
  fullPath: string;
  sizeBytes: number;
  sizeFormatted: string;
  quantization: string;
  architecture: string;
  contextLength: number;
  capabilities: {
    reasoning: boolean;
    image: boolean;
    embedding: boolean;
  };
  type: 'chat' | 'embedding';
  status: 'loaded' | 'ready' | 'error';
  loadedAt?: number;
  hasGuide?: boolean;
  systemPrompt?: string;
  parameters?: Record<string, any>;
  chatTemplate?: string;
  zeroCopy?: boolean;
  manifestPath?: string;
  lastSelfTest?: {
    passed: boolean;
    message: string;
    tokensPerSec?: number;
    timestamp?: number;
  };
}

interface HfFileItem {
  filename: string;
  sizeBytes: number;
  sizeFormatted: string;
  quantization: string;
  downloadUrl: string;
}

interface DownloadProgress {
  id: string;
  filename: string;
  repo?: string;
  url: string;
  totalBytes: number;
  downloadedBytes: number;
  percentage: number;
  speedMBs: number;
  etaSeconds: number;
  status: 'downloading' | 'completed' | 'cancelled' | 'error';
  error?: string;
}

interface PipelineStepState {
  step: number;
  title: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  log?: string;
}

const DEFAULT_PIPELINE_STEPS: PipelineStepState[] = [
  { step: 1, title: 'Locating & Verifying GGUF Binary...', status: 'pending' },
  { step: 2, title: 'Inspecting GGUF Architecture & Metadata...', status: 'pending' },
  { step: 3, title: 'Merging Guide / Modelfile Configuration...', status: 'pending' },
  { step: 4, title: 'Initializing Inference Engine & Self-Test...', status: 'pending' },
  { step: 5, title: 'Registering Active Model in Gateway...', status: 'pending' },
];

export const LocalGgufManager: React.FC<LocalGgufManagerProps> = ({ onModelsUpdated }) => {
  const [models, setModels] = useState<ScannedModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'installed' | 'upload' | 'hf'>('installed');

  // Hugging Face Downloader State
  const [hfInput, setHfInput] = useState('');
  const [isSearchingHf, setIsSearchingHf] = useState(false);
  const [hfFiles, setHfFiles] = useState<HfFileItem[]>([]);
  const [hfSearchError, setHfSearchError] = useState<string | null>(null);
  const [activeDownload, setActiveDownload] = useState<DownloadProgress | null>(null);

  // Upload & Setup Form State
  const [importMode, setImportMode] = useState<'zerocopy' | 'upload'>('zerocopy');
  const [localPathInput, setLocalPathInput] = useState('');
  const [guideInputMode, setGuideInputMode] = useState<'direct' | 'path'>('direct');
  const [guideFilePathInput, setGuideFilePathInput] = useState('');
  const [guideDirectContent, setGuideDirectContent] = useState('');

  // Browser Upload State
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [selectedGgufFile, setSelectedGgufFile] = useState<File | null>(null);
  const [selectedGuideFile, setSelectedGuideFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const guideFileInputRef = useRef<HTMLInputElement>(null);

  // 5-Stage Setup Pipeline Modal / Visual Tracker State
  const [isPipelineRunning, setIsPipelineRunning] = useState(false);
  const [pipelineSteps, setPipelineSteps] = useState<PipelineStepState[]>(DEFAULT_PIPELINE_STEPS);
  const [pipelineLogs, setPipelineLogs] = useState<string[]>([]);
  const [pipelineCurrentStep, setPipelineCurrentStep] = useState<number>(0);
  const [pipelineCompletedModel, setPipelineCompletedModel] = useState<ScannedModel | null>(null);
  const [pipelineError, setPipelineError] = useState<string | null>(null);
  const terminalLogEndRef = useRef<HTMLDivElement>(null);

  // Manifest Details Modal
  const [selectedManifestModel, setSelectedManifestModel] = useState<ScannedModel | null>(null);
  const [manifestData, setManifestData] = useState<any>(null);
  const [isLoadingManifest, setIsLoadingManifest] = useState(false);

  // Edit Model Settings Modal state
  const [editingModel, setEditingModel] = useState<ScannedModel | null>(null);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editReasoning, setEditReasoning] = useState(false);
  const [editVision, setEditVision] = useState(false);
  const [editContextSize, setEditContextSize] = useState<number>(2048);
  const [editSystemPrompt, setEditSystemPrompt] = useState('');
  const [editTemperature, setEditTemperature] = useState<number>(0.7);
  const [editTopP, setEditTopP] = useState<number>(0.9);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Self-Test on-demand state
  const [testingModelId, setTestingModelId] = useState<string | null>(null);

  // Auto-scroll terminal log
  useEffect(() => {
    terminalLogEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [pipelineLogs]);

  const fetchModels = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/gateway/local-gguf/models');
      if (res.ok) {
        const data = await res.json();
        setModels(data.models || []);
        await syncLocalGgufModels();
        onModelsUpdated?.(data.models || []);
      }
    } catch (err) {
      console.error('Failed to fetch local GGUF models:', err);
    } finally {
      setIsLoading(false);
    }
  }, [onModelsUpdated]);

  // Initial Fetch & Progress Polling
  useEffect(() => {
    fetchModels();

    const handleRegistryUpdated = () => {
      fetchModels();
    };
    window.addEventListener('gateway-registry-updated', handleRegistryUpdated);

    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/gateway/local-gguf/hf/progress');
        if (res.ok) {
          const data = await res.json();
          if (data.progress && data.progress.status === 'downloading') {
            setActiveDownload(data.progress);
          } else if (data.progress?.status === 'completed') {
            setActiveDownload(null);
            fetchModels();
          } else if (data.progress?.status === 'cancelled' || data.progress?.status === 'error') {
            setActiveDownload(data.progress);
          }
        }
      } catch {}
    }, 1000);

    return () => {
      window.removeEventListener('gateway-registry-updated', handleRegistryUpdated);
      clearInterval(interval);
    };
  }, [fetchModels]);

  const handleScan = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/gateway/local-gguf/scan', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setModels(data.models || []);
        await syncLocalGgufModels();
        onModelsUpdated?.(data.models || []);
      }
    } catch (err) {
      console.error('Failed to rescan /models folder:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Switch to chat with a model selected
  const handleChatWithModel = (modelId: string) => {
    window.dispatchEvent(new CustomEvent('gateway:select-model', { detail: { modelId } }));
    window.dispatchEvent(new CustomEvent('gateway:switch-view', { detail: { viewMode: 'split' } }));
  };

  // Run On-Demand Self-Test
  const handleRunSelfTest = async (modelId: string) => {
    setTestingModelId(modelId);
    try {
      const res = await fetch('/api/gateway/local-gguf/self-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelId }),
      });
      const data = await res.json();
      if (data.passed) {
        alert(`✅ ${data.message}`);
      } else {
        alert(`⚠️ Self-test notice: ${data.message}`);
      }
      fetchModels();
    } catch (err: any) {
      alert(`Self-test error: ${err.message}`);
    } finally {
      setTestingModelId(null);
    }
  };

  // View Manifest Details
  const handleOpenManifest = async (model: ScannedModel) => {
    setSelectedManifestModel(model);
    setIsLoadingManifest(true);
    try {
      const res = await fetch(`/api/gateway/local-gguf/manifest?modelId=${encodeURIComponent(model.id)}`);
      if (res.ok) {
        const data = await res.json();
        setManifestData(data.manifest || null);
      }
    } catch (err) {
      console.error('Failed to load manifest:', err);
    } finally {
      setIsLoadingManifest(false);
    }
  };

  // Open Edit Model Settings Modal
  const handleOpenEditModel = async (model: ScannedModel) => {
    setEditingModel(model);
    setEditDisplayName(model.name || model.id);
    setEditReasoning(Boolean(model.capabilities?.reasoning));
    setEditVision(Boolean(model.capabilities?.image));
    setEditContextSize(model.contextLength || 2048);
    setEditSystemPrompt(model.systemPrompt || '');
    setEditTemperature(model.parameters?.temperature ?? 0.7);
    setEditTopP(model.parameters?.top_p ?? 0.9);

    try {
      const res = await fetch(`/api/gateway/local-gguf/manifest?modelId=${encodeURIComponent(model.id)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.manifest) {
          if (data.manifest.name) setEditDisplayName(data.manifest.name);
          if (data.manifest.systemPrompt !== undefined) setEditSystemPrompt(data.manifest.systemPrompt);
          if (data.manifest.parameters?.num_ctx) setEditContextSize(data.manifest.parameters.num_ctx);
          if (data.manifest.parameters?.temperature !== undefined) setEditTemperature(data.manifest.parameters.temperature);
          if (data.manifest.parameters?.top_p !== undefined) setEditTopP(data.manifest.parameters.top_p);
        }
      }
    } catch {}
  };

  // Save Model Settings (Rename & Settings)
  const handleSaveModelSettings = async () => {
    if (!editingModel) return;
    setIsSavingSettings(true);
    try {
      const res = await fetch(`/api/gateway/local-gguf/models/${encodeURIComponent(editingModel.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editDisplayName.trim() || editingModel.id,
          capabilities: {
            reasoning: editReasoning,
            image: editVision,
            embedding: Boolean(editingModel.capabilities?.embedding),
          },
          contextLength: editContextSize,
          systemPrompt: editSystemPrompt,
          parameters: {
            temperature: editTemperature,
            top_p: editTopP,
            num_ctx: editContextSize,
          },
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to save model settings');
      }

      await syncLocalGgufModels();
      await fetchModels();
      setEditingModel(null);
    } catch (err: any) {
      alert(`Save error: ${err.message}`);
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Execute 5-Stage Setup Pipeline via SSE
  const startSetupPipelineStream = async (payload: {
    modelPath?: string;
    filename?: string;
    guideContent?: string;
    guidePath?: string;
    isZeroCopy?: boolean;
  }) => {
    setIsPipelineRunning(true);
    setPipelineError(null);
    setPipelineCompletedModel(null);
    setPipelineCurrentStep(1);
    setPipelineSteps(
      DEFAULT_PIPELINE_STEPS.map((s) => ({
        ...s,
        status: s.step === 1 ? 'running' : 'pending',
      }))
    );
    setPipelineLogs([`[0.0s] Initializing Post-Upload Auto-Setup Pipeline...`]);

    try {
      const response = await fetch('/api/gateway/local-gguf/setup-pipeline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        },
        body: JSON.stringify({
          ...payload,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Readable stream not available on setup response.');

      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;
          if (trimmed === 'data: [DONE]') break;

          try {
            const parsed = JSON.parse(trimmed.substring(6));

            if (parsed.type === 'step') {
              const ev = parsed.event;
              setPipelineCurrentStep(ev.step);
              setPipelineLogs((prev) => [
                ...prev,
                `[Step ${ev.step}/5] ${ev.title} -> ${ev.log}`,
              ]);

              setPipelineSteps((prev) =>
                prev.map((s) => {
                  if (s.step < ev.step) {
                    return { ...s, status: 'completed' };
                  }
                  if (s.step === ev.step) {
                    return {
                      ...s,
                      status: ev.status === 'completed' ? 'completed' : 'running',
                      log: ev.log,
                    };
                  }
                  return s;
                })
              );
            } else if (parsed.type === 'complete') {
              setPipelineCurrentStep(5);
              setPipelineSteps((prev) => prev.map((s) => ({ ...s, status: 'completed' })));
              setPipelineLogs((prev) => [
                ...prev,
                `🎉 [COMPLETED] Model "${parsed.result.model.name}" is fully mounted, verified, and ready!`,
              ]);
              setPipelineCompletedModel(parsed.result.model);
              await syncLocalGgufModels();
              await fetchModels();
            } else if (parsed.type === 'error') {
              setPipelineError(parsed.error);
              setPipelineLogs((prev) => [...prev, `❌ [ERROR] ${parsed.error}`]);
              setPipelineSteps((prev) =>
                prev.map((s) => (s.status === 'running' ? { ...s, status: 'error' } : s))
              );
            }
          } catch {}
        }
      }
    } catch (err: any) {
      setPipelineError(err.message || 'Setup pipeline connection failed.');
      setPipelineLogs((prev) => [...prev, `❌ [CRITICAL] Connection failure: ${err.message}`]);
    }
  };

  // Submit Zero-Copy Local File Path Mount
  const handleMountZeroCopy = async (e: React.FormEvent) => {
    e.preventDefault();
    const sourcePath = localPathInput.trim();
    if (!sourcePath) return;

    const guideContent = guideInputMode === 'direct' ? guideDirectContent : undefined;
    const guidePath = guideInputMode === 'path' ? guideFilePathInput.trim() : undefined;

    await startSetupPipelineStream({
      modelPath: sourcePath,
      guideContent,
      guidePath,
      isZeroCopy: true,
    });
  };

  // Submit Browser File Upload
  const handleBrowserUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGgufFile) {
      alert('Please select a .gguf model file to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedGgufFile);

    if (selectedGuideFile) {
      formData.append('guideFile', selectedGuideFile);
    }

    if (guideDirectContent.trim()) {
      formData.append('guideContent', guideDirectContent.trim());
    }

    setUploadProgress(5);
    setIsPipelineRunning(true);
    setPipelineCurrentStep(1);
    setPipelineLogs([`[0.0s] Streaming upload of "${selectedGgufFile.name}" to disk (/models)...`]);
    setPipelineSteps(
      DEFAULT_PIPELINE_STEPS.map((s) => ({
        ...s,
        status: s.step === 1 ? 'running' : 'pending',
      }))
    );

    try {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/gateway/local-gguf/upload');

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percent);
          if (percent < 100) {
            setPipelineLogs((prev) => {
              const last = prev[prev.length - 1];
              if (last && last.startsWith('Uploading')) {
                return [...prev.slice(0, -1), `Uploading binary: ${percent}%`];
              }
              return [...prev, `Uploading binary: ${percent}%`];
            });
          }
        }
      };

      xhr.onload = async () => {
        setUploadProgress(null);
        if (xhr.status === 200) {
          try {
            const data = JSON.parse(xhr.responseText);
            setPipelineSteps((prev) => prev.map((s) => ({ ...s, status: 'completed' })));
            setPipelineCompletedModel(data.model);
            setPipelineLogs((prev) => [
              ...prev,
              `✅ Upload and 5-stage setup pipeline complete! Model "${data.model.name}" is ready to chat.`,
            ]);
            await syncLocalGgufModels();
            await fetchModels();
          } catch {
            fetchModels();
          }
        } else {
          setPipelineError(`Upload failed with status ${xhr.status}: ${xhr.responseText}`);
          setPipelineLogs((prev) => [...prev, `❌ Upload error: ${xhr.responseText}`]);
        }
      };

      xhr.onerror = () => {
        setUploadProgress(null);
        setPipelineError('Upload network connection error occurred.');
        setPipelineLogs((prev) => [...prev, `❌ Upload network connection error.`]);
      };

      xhr.send(formData);
    } catch (err: any) {
      setUploadProgress(null);
      setPipelineError(err.message);
    }
  };

  // Hugging Face Handlers
  const handleSearchHf = async (repoQuery?: string) => {
    const targetRepo = repoQuery || hfInput.trim();
    if (!targetRepo) return;

    setIsSearchingHf(true);
    setHfSearchError(null);
    setHfFiles([]);

    try {
      const res = await fetch(
        `/api/gateway/local-gguf/hf/search?repo=${encodeURIComponent(targetRepo)}`
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to search Hugging Face repository');
      }
      setHfFiles(data.files || []);
    } catch (err: any) {
      setHfSearchError(err.message);
    } finally {
      setIsSearchingHf(false);
    }
  };

  const handleStartDownload = async (file: HfFileItem) => {
    try {
      const res = await fetch('/api/gateway/local-gguf/hf/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: file.downloadUrl,
          filename: file.filename,
          repo: hfInput.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to start download');
      }
      setActiveDownload(data.progress);
    } catch (err: any) {
      alert(`Download error: ${err.message}`);
    }
  };

  const handleCancelDownload = async () => {
    try {
      await fetch('/api/gateway/local-gguf/hf/cancel', { method: 'POST' });
      setActiveDownload(null);
    } catch (err) {
      console.error('Failed to cancel download:', err);
    }
  };

  const handleLoadModel = async (modelId: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/gateway/local-gguf/load', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelId }),
      });
      if (res.ok) {
        fetchModels();
      } else {
        const data = await res.json();
        alert(`Failed to load model: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Error loading model: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnloadModel = async () => {
    setIsLoading(true);
    try {
      await fetch('/api/gateway/local-gguf/unload', { method: 'POST' });
      fetchModels();
    } catch (err: any) {
      console.error('Failed to unload model:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteModel = async (model: ScannedModel) => {
    if (!confirm(`Are you sure you want to permanently delete "${model.name}" and its binary file (.gguf and .manifest.json) from disk?`)) {
      return;
    }
    try {
      await deleteLocalGgufModelEverywhere(model.id);
      await fetchModels();
    } catch (err: any) {
      alert(`Failed to delete model: ${err.message}`);
    }
  };

  const loadedModel = models.find((m) => m.status === 'loaded');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px' }}>
      {/* Top Banner / Engine Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#0f172a',
          padding: '16px 20px',
          borderRadius: '12px',
          border: '1px solid #1e293b',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              backgroundColor: '#6366f1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 0 16px rgba(99, 102, 241, 0.4)',
            }}
          >
            <Cpu size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>
                Native Local GGUF Engine
              </h2>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  backgroundColor: '#312e81',
                  color: '#c7d2fe',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                }}
              >
                node-llama-cpp v3
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  backgroundColor: '#064e3b',
                  color: '#6ee7b7',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                }}
              >
                Auto-Setup Pipeline Ready
              </span>
            </div>
            <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#94a3b8' }}>
              Direct GGUF model execution, Modelfile/guide auto-merging, and zero-copy mounting without cloud fees.
            </p>
          </div>
        </div>

        {/* Engine Actions & Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {loadedModel && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid #22c55e',
                padding: '6px 12px',
                borderRadius: '8px',
              }}
            >
              <Zap size={14} color="#22c55e" />
              <span style={{ fontSize: '12px', color: '#86efac', fontWeight: 600 }}>
                Active in RAM: {loadedModel.name}
              </span>
              <button
                type="button"
                onClick={handleUnloadModel}
                style={{
                  backgroundColor: '#1e293b',
                  color: '#e2e8f0',
                  border: '1px solid #475569',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '10px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Unload
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={handleScan}
            disabled={isLoading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#1e293b',
              color: '#f8fafc',
              border: '1px solid #334155',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
            <span>Scan /models Folder</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #1e293b', paddingBottom: '8px' }}>
        <button
          type="button"
          onClick={() => setActiveTab('installed')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            backgroundColor: activeTab === 'installed' ? '#6366f1' : '#1e293b',
            color: activeTab === 'installed' ? '#ffffff' : '#94a3b8',
          }}
        >
          <HardDrive size={15} />
          <span>Installed & Mounted Models ({models.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('upload')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            backgroundColor: activeTab === 'upload' ? '#6366f1' : '#1e293b',
            color: activeTab === 'upload' ? '#ffffff' : '#94a3b8',
          }}
        >
          <Upload size={15} />
          <span>Auto-Setup & Guide Merger (Zero-Copy / Upload)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('hf')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            backgroundColor: activeTab === 'hf' ? '#6366f1' : '#1e293b',
            color: activeTab === 'hf' ? '#ffffff' : '#94a3b8',
          }}
        >
          <Download size={15} />
          <span>Download from Hugging Face</span>
        </button>
      </div>

      {/* Active Hugging Face Download Banner */}
      {activeDownload && (
        <div
          style={{
            backgroundColor: '#1e1b4b',
            border: '1px solid #4338ca',
            borderRadius: '10px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Download size={16} color="#818cf8" />
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc' }}>
                Downloading: {activeDownload.filename}
              </span>
              <span
                style={{
                  fontSize: '11px',
                  backgroundColor: '#312e81',
                  color: '#c7d2fe',
                  padding: '2px 6px',
                  borderRadius: '4px',
                }}
              >
                {activeDownload.speedMBs} MB/s
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '12px', color: '#c7d2fe' }}>
                ETA: {activeDownload.etaSeconds}s • {activeDownload.percentage}%
              </span>
              <button
                type="button"
                onClick={handleCancelDownload}
                style={{
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  border: 'none',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>
            </div>
          </div>

          <div
            style={{
              width: '100%',
              height: '8px',
              backgroundColor: '#312e81',
              borderRadius: '9999px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${activeDownload.percentage}%`,
                height: '100%',
                backgroundColor: '#6366f1',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>
      )}

      {/* TAB 1: INSTALLED MODELS */}
      {activeTab === 'installed' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {models.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '60px 20px',
                backgroundColor: '#090d16',
                borderRadius: '12px',
                border: '1px dashed #334155',
              }}
            >
              <HardDrive size={36} color="#64748b" style={{ margin: '0 auto 12px' }} />
              <h3 style={{ margin: '0 0 6px', color: '#f8fafc', fontSize: '15px' }}>
                No GGUF models mounted or installed yet
              </h3>
              <p style={{ margin: '0 0 16px', color: '#94a3b8', fontSize: '13px' }}>
                Mount an existing .gguf file from your hard drive with zero copying or upload a new model with its Modelfile guide.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                style={{
                  backgroundColor: '#6366f1',
                  color: '#ffffff',
                  border: 'none',
                  padding: '8px 18px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                ⚡ Mount or Upload GGUF Model
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
              {models.map((m) => (
                <div
                  key={m.id}
                  style={{
                    backgroundColor: '#0d1322',
                    borderRadius: '10px',
                    border: '1px solid #1e293b',
                    padding: '16px 20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '16px',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc' }}>
                        {m.name}
                      </span>

                      {/* Zero-Copy vs Local Disk */}
                      {m.zeroCopy ? (
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            backgroundColor: '#0f766e',
                            color: '#ccfbf1',
                            padding: '2px 8px',
                            borderRadius: '4px',
                          }}
                        >
                          ⚡ Zero-Copy Mounted
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 600,
                            backgroundColor: '#1e293b',
                            color: '#94a3b8',
                            padding: '2px 6px',
                            borderRadius: '4px',
                          }}
                        >
                          /models Disk
                        </span>
                      )}

                      {/* Quantization */}
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          backgroundColor: '#312e81',
                          color: '#c7d2fe',
                          padding: '2px 6px',
                          borderRadius: '4px',
                        }}
                      >
                        {m.quantization}
                      </span>

                      {/* Architecture */}
                      <span
                        style={{
                          fontSize: '11px',
                          backgroundColor: '#1e293b',
                          color: '#94a3b8',
                          padding: '2px 6px',
                          borderRadius: '4px',
                        }}
                      >
                        Arch: {m.architecture}
                      </span>

                      {/* Guide badge */}
                      {m.hasGuide && (
                        <span
                          style={{
                            fontSize: '11px',
                            backgroundColor: '#064e3b',
                            color: '#6ee7b7',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <FileText size={11} />
                          Guide Merged
                        </span>
                      )}

                      {/* Self-test badge */}
                      {m.lastSelfTest?.passed && (
                        <span
                          style={{
                            fontSize: '11px',
                            backgroundColor: '#14532d',
                            color: '#86efac',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <CheckCircle2 size={11} />
                          {m.lastSelfTest.tokensPerSec
                            ? `${m.lastSelfTest.tokensPerSec} tok/s`
                            : 'Self-Test OK'}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', color: '#94a3b8' }}>
                      <span>Size: <strong style={{ color: '#cbd5e1' }}>{m.sizeFormatted}</strong></span>
                      <span>Context: <strong style={{ color: '#cbd5e1' }}>{m.contextLength.toLocaleString()} tokens</strong></span>
                      <span style={{ fontSize: '11px', color: '#64748b', wordBreak: 'break-all' }}>
                        Path: {m.fullPath}
                      </span>
                    </div>

                    {m.systemPrompt && (
                      <div
                        style={{
                          fontSize: '11px',
                          color: '#94a3b8',
                          backgroundColor: '#090d16',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          borderLeft: '3px solid #6366f1',
                          marginTop: '2px',
                          maxWidth: '700px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <strong style={{ color: '#c7d2fe' }}>System Guide: </strong>
                        {m.systemPrompt}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* Chat Now */}
                    <button
                      type="button"
                      onClick={() => handleChatWithModel(m.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: '#2563eb',
                        color: '#ffffff',
                        border: 'none',
                        padding: '7px 14px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      <MessageSquare size={13} />
                      <span>Chat in Sandbox</span>
                    </button>

                    {/* View Guide / Manifest */}
                    <button
                      type="button"
                      onClick={() => handleOpenManifest(m)}
                      title="View Merged Manifest & Guide Configuration"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        backgroundColor: '#1e293b',
                        color: '#c7d2fe',
                        border: '1px solid #334155',
                        padding: '7px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      <FileCode size={13} />
                      <span>Guide & Config</span>
                    </button>

                    {/* Edit Model Settings */}
                    <button
                      type="button"
                      onClick={() => handleOpenEditModel(m)}
                      title="Edit Display Name, Reasoning, Context Size, and System Guide"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        backgroundColor: '#1e293b',
                        color: '#f59e0b',
                        border: '1px solid #334155',
                        padding: '7px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      <Edit2 size={13} />
                      <span>Edit Settings</span>
                    </button>

                    {/* Run Self-Test */}
                    <button
                      type="button"
                      onClick={() => handleRunSelfTest(m.id)}
                      disabled={testingModelId === m.id}
                      title="Test Inference Engine Token Generation"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        backgroundColor: '#1e293b',
                        color: '#34d399',
                        border: '1px solid #334155',
                        padding: '7px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {testingModelId === m.id ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Play size={13} />
                      )}
                      <span>Test Engine</span>
                    </button>

                    {/* Mount / Load into RAM */}
                    {m.status === 'loaded' ? (
                      <button
                        type="button"
                        onClick={handleUnloadModel}
                        title="Unload from memory"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          backgroundColor: '#064e3b',
                          color: '#6ee7b7',
                          border: '1px solid #059669',
                          padding: '7px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        <Zap size={13} />
                        <span>Loaded</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleLoadModel(m.id)}
                        disabled={isLoading}
                        title="Preload Model into RAM/VRAM"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          backgroundColor: '#1e293b',
                          color: '#e2e8f0',
                          border: '1px solid #334155',
                          padding: '7px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        <Zap size={13} />
                        <span>Load to RAM</span>
                      </button>
                    )}

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => handleDeleteModel(m)}
                      title="Permanently Delete Model & Files from Disk"
                      style={{
                        backgroundColor: '#1e293b',
                        color: '#ef4444',
                        border: '1px solid #334155',
                        padding: '7px 10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: POST-UPLOAD AUTO-SETUP & GUIDE MERGER */}
      {activeTab === 'upload' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Mode Switcher */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setImportMode('zerocopy')}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px',
                borderRadius: '8px',
                border: importMode === 'zerocopy' ? '2px solid #6366f1' : '1px solid #1e293b',
                backgroundColor: importMode === 'zerocopy' ? 'rgba(99, 102, 241, 0.15)' : '#0d1322',
                color: importMode === 'zerocopy' ? '#f8fafc' : '#94a3b8',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              <FolderInput size={18} color={importMode === 'zerocopy' ? '#818cf8' : '#64748b'} />
              <span>Zero-Copy Local Disk Path (Instant 2-Second Setup for 2GB–15GB+ Files)</span>
            </button>

            <button
              type="button"
              onClick={() => setImportMode('upload')}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px',
                borderRadius: '8px',
                border: importMode === 'upload' ? '2px solid #34d399' : '1px solid #1e293b',
                backgroundColor: importMode === 'upload' ? 'rgba(52, 211, 153, 0.15)' : '#0d1322',
                color: importMode === 'upload' ? '#f8fafc' : '#94a3b8',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              <Upload size={18} color={importMode === 'upload' ? '#34d399' : '#64748b'} />
              <span>Browser Drag & Drop Upload (.gguf + Guide File)</span>
            </button>
          </div>

          {/* MODE A: ZERO-COPY DISK PATH */}
          {importMode === 'zerocopy' && (
            <div
              style={{
                backgroundColor: '#0d1322',
                borderRadius: '10px',
                border: '1px solid #1e293b',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '18px',
              }}
            >
              <div>
                <h3 style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: 700, color: '#f8fafc' }}>
                  Zero-Copy Instant Disk Mount & Auto-Setup
                </h3>
                <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>
                  Mount any .gguf file already on your hard drive (e.g. from LM Studio, Ollama, Jan, or Hugging Face cache) without copying gigabytes of data. Auto-extracts architecture, merges your guide file, runs self-test, and registers it in 2 seconds.
                </p>
              </div>

              <form onSubmit={handleMountZeroCopy} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#e2e8f0', marginBottom: '6px' }}>
                    Local .gguf File Path (Required):
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. C:\Users\YourName\models\qwen2.5-coder-7b-q4_k_m.gguf or E:\zero\Model Gateway\models\moondream2-mmproj-f16-20250414.gguf"
                    value={localPathInput}
                    onChange={(e) => setLocalPathInput(e.target.value)}
                    style={{
                      width: '100%',
                      backgroundColor: '#090d16',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      color: '#f8fafc',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                  {/* Quick autofill helper */}
                  <div style={{ marginTop: '6px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>Quick Test Path:</span>
                    <button
                      type="button"
                      onClick={() => setLocalPathInput('models/moondream2-mmproj-f16-20250414.gguf')}
                      style={{
                        backgroundColor: '#1e293b',
                        color: '#c7d2fe',
                        border: '1px solid #3730a3',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        cursor: 'pointer',
                      }}
                    >
                      Use existing /models/moondream2-mmproj-f16-20250414.gguf
                    </button>
                  </div>
                </div>

                {/* Guide / Modelfile Configurator */}
                <div style={{ backgroundColor: '#090d16', padding: '16px', borderRadius: '8px', border: '1px solid #1e293b' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileText size={16} color="#818cf8" />
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc' }}>
                        Optional Guide / Modelfile Configuration:
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => setGuideInputMode('direct')}
                        style={{
                          backgroundColor: guideInputMode === 'direct' ? '#312e81' : '#1e293b',
                          color: guideInputMode === 'direct' ? '#c7d2fe' : '#94a3b8',
                          border: 'none',
                          padding: '4px 10px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Write / Paste Direct
                      </button>
                      <button
                        type="button"
                        onClick={() => setGuideInputMode('path')}
                        style={{
                          backgroundColor: guideInputMode === 'path' ? '#312e81' : '#1e293b',
                          color: guideInputMode === 'path' ? '#c7d2fe' : '#94a3b8',
                          border: 'none',
                          padding: '4px 10px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Guide File Path (.txt / Modelfile / .json)
                      </button>
                    </div>
                  </div>

                  {guideInputMode === 'path' ? (
                    <div>
                      <input
                        type="text"
                        placeholder="e.g. C:\Users\...\Modelfile or C:\Users\...\guide.txt"
                        value={guideFilePathInput}
                        onChange={(e) => setGuideFilePathInput(e.target.value)}
                        style={{
                          width: '100%',
                          backgroundColor: '#0d1322',
                          border: '1px solid #334155',
                          borderRadius: '6px',
                          padding: '8px 12px',
                          color: '#f8fafc',
                          fontSize: '12px',
                          outline: 'none',
                        }}
                      />
                    </div>
                  ) : (
                    <div>
                      {/* Presets */}
                      <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '11px', color: '#64748b', alignSelf: 'center' }}>Presets:</span>
                        <button
                          type="button"
                          onClick={() =>
                            setGuideDirectContent(
                              'SYSTEM """\nYou are an expert fullstack software architect. You write ultra-clean, high-performance code with concise explanations.\n"""\nPARAMETER temperature 0.3\nPARAMETER top_p 0.85\nPARAMETER num_ctx 8192\nPARAMETER stop "<|im_end|>"'
                            )
                          }
                          style={{
                            backgroundColor: '#1e293b',
                            color: '#94a3b8',
                            border: '1px solid #334155',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            cursor: 'pointer',
                          }}
                        >
                          Ollama Modelfile Template
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setGuideDirectContent(
                              'You are a high-speed AI assistant specialized in system architecture and coding. Always deliver correct, production-grade solutions.'
                            )
                          }
                          style={{
                            backgroundColor: '#1e293b',
                            color: '#94a3b8',
                            border: '1px solid #334155',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            cursor: 'pointer',
                          }}
                        >
                          Plain Text System Guide
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setGuideDirectContent(
                              JSON.stringify(
                                {
                                  systemPrompt: 'You are a reasoning-focused autonomous assistant.',
                                  parameters: { temperature: 0.2, num_ctx: 16384, top_p: 0.9 },
                                },
                                null,
                                2
                              )
                            )
                          }
                          style={{
                            backgroundColor: '#1e293b',
                            color: '#94a3b8',
                            border: '1px solid #334155',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            cursor: 'pointer',
                          }}
                        >
                          JSON Config Format
                        </button>
                      </div>

                      <textarea
                        rows={5}
                        placeholder='Paste Ollama Modelfile syntax (SYSTEM """...""" PARAMETER temperature 0.7) or plain text guide instructions...'
                        value={guideDirectContent}
                        onChange={(e) => setGuideDirectContent(e.target.value)}
                        style={{
                          width: '100%',
                          backgroundColor: '#0d1322',
                          border: '1px solid #334155',
                          borderRadius: '6px',
                          padding: '8px 12px',
                          color: '#f8fafc',
                          fontFamily: 'monospace',
                          fontSize: '12px',
                          outline: 'none',
                          resize: 'vertical',
                        }}
                      />
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!localPathInput.trim() || isPipelineRunning}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    backgroundColor: '#6366f1',
                    color: '#ffffff',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: !localPathInput.trim() || isPipelineRunning ? 'not-allowed' : 'pointer',
                    opacity: !localPathInput.trim() || isPipelineRunning ? 0.6 : 1,
                  }}
                >
                  <Zap size={16} />
                  <span>Auto-Setup & Mount Model (Zero-Copy)</span>
                </button>
              </form>
            </div>
          )}

          {/* MODE B: BROWSER UPLOAD */}
          {importMode === 'upload' && (
            <div
              style={{
                backgroundColor: '#0d1322',
                borderRadius: '10px',
                border: '1px solid #1e293b',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '18px',
              }}
            >
              <div>
                <h3 style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: 700, color: '#f8fafc' }}>
                  Upload .gguf Model + Optional Guide File
                </h3>
                <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>
                  Stream-uploads directly to the local /models folder. The 5-stage setup pipeline automatically runs upon completion to merge the guide file and activate the model.
                </p>
              </div>

              <form onSubmit={handleBrowserUploadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  {/* GGUF File Input */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: '2px dashed #334155',
                      borderRadius: '8px',
                      padding: '24px 16px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      backgroundColor: selectedGgufFile ? '#0f172a' : '#090d16',
                    }}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept=".gguf"
                      onChange={(e) => setSelectedGgufFile(e.target.files?.[0] || null)}
                      style={{ display: 'none' }}
                    />
                    <Upload size={24} color="#34d399" style={{ margin: '0 auto 8px' }} />
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc' }}>
                      {selectedGgufFile ? selectedGgufFile.name : 'Select or Drop .gguf Model File'}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                      {selectedGgufFile
                        ? `Ready (${(selectedGgufFile.size / (1024 * 1024)).toFixed(1)} MB)`
                        : 'Required (.gguf format)'}
                    </div>
                  </div>

                  {/* Optional Guide File Input */}
                  <div
                    onClick={() => guideFileInputRef.current?.click()}
                    style={{
                      border: '2px dashed #334155',
                      borderRadius: '8px',
                      padding: '24px 16px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      backgroundColor: selectedGuideFile ? '#0f172a' : '#090d16',
                    }}
                  >
                    <input
                      type="file"
                      ref={guideFileInputRef}
                      accept=".txt,.json,Modelfile"
                      onChange={(e) => setSelectedGuideFile(e.target.files?.[0] || null)}
                      style={{ display: 'none' }}
                    />
                    <FileText size={24} color="#818cf8" style={{ margin: '0 auto 8px' }} />
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc' }}>
                      {selectedGuideFile ? selectedGuideFile.name : 'Optional Guide File (.txt / Modelfile / .json)'}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                      {selectedGuideFile ? 'Guide file attached' : 'Click to select optional guide / instructions file'}
                    </div>
                  </div>
                </div>

                {/* Direct text instructions fallback */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                    Or Paste Guide Instructions Directly:
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Enter system prompt or Modelfile directives (SYSTEM, PARAMETER temperature, etc.)..."
                    value={guideDirectContent}
                    onChange={(e) => setGuideDirectContent(e.target.value)}
                    style={{
                      width: '100%',
                      backgroundColor: '#090d16',
                      border: '1px solid #334155',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      color: '#f8fafc',
                      fontFamily: 'monospace',
                      fontSize: '12px',
                      outline: 'none',
                    }}
                  />
                </div>

                {uploadProgress !== null && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                      <span>Streaming binary to /models...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', backgroundColor: '#1e293b', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${uploadProgress}%`, height: '100%', backgroundColor: '#34d399', transition: 'width 0.2s ease' }} />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!selectedGgufFile || isPipelineRunning}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    backgroundColor: '#059669',
                    color: '#ffffff',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: !selectedGgufFile || isPipelineRunning ? 'not-allowed' : 'pointer',
                    opacity: !selectedGgufFile || isPipelineRunning ? 0.6 : 1,
                  }}
                >
                  <Upload size={16} />
                  <span>Upload & Run Auto-Setup Pipeline</span>
                </button>
              </form>
            </div>
          )}

          {/* REAL-TIME 5-STAGE SETUP PIPELINE MONITOR (ACTIVE OR RECENT) */}
          {isPipelineRunning && (
            <div
              style={{
                backgroundColor: '#090d16',
                border: '1px solid #334155',
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Sparkles size={18} color="#818cf8" />
                  <span style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc' }}>
                    Post-Upload Auto-Setup Pipeline in Progress
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      backgroundColor: pipelineCompletedModel ? '#064e3b' : '#312e81',
                      color: pipelineCompletedModel ? '#6ee7b7' : '#c7d2fe',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontWeight: 700,
                    }}
                  >
                    {pipelineCompletedModel ? 'PIPELINE COMPLETED' : `STEP ${pipelineCurrentStep} OF 5`}
                  </span>
                </div>
              </div>

              {/* Progress Bar (20% per step) */}
              <div
                style={{
                  width: '100%',
                  height: '8px',
                  backgroundColor: '#1e293b',
                  borderRadius: '9999px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${Math.min(100, pipelineCurrentStep * 20)}%`,
                    height: '100%',
                    backgroundColor: pipelineCompletedModel ? '#10b981' : '#6366f1',
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>

              {/* 5 Stages Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
                {pipelineSteps.map((st) => {
                  const isDone = st.status === 'completed';
                  const isRunning = st.status === 'running';
                  const isErr = st.status === 'error';

                  return (
                    <div
                      key={st.step}
                      style={{
                        backgroundColor: isDone
                          ? 'rgba(16, 185, 129, 0.08)'
                          : isRunning
                          ? 'rgba(99, 102, 241, 0.15)'
                          : '#0d1322',
                        border: isDone
                          ? '1px solid #059669'
                          : isRunning
                          ? '1px solid #6366f1'
                          : '1px solid #1e293b',
                        borderRadius: '8px',
                        padding: '10px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {isDone && <CheckCircle2 size={14} color="#10b981" />}
                        {isRunning && <Loader2 size={14} color="#818cf8" className="animate-spin" />}
                        {isErr && <XCircle size={14} color="#ef4444" />}
                        {!isDone && !isRunning && !isErr && (
                          <div
                            style={{
                              width: '14px',
                              height: '14px',
                              borderRadius: '50%',
                              border: '1px solid #475569',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '9px',
                              color: '#64748b',
                            }}
                          >
                            {st.step}
                          </div>
                        )}
                        <span style={{ fontSize: '11px', fontWeight: 700, color: isDone ? '#6ee7b7' : isRunning ? '#c7d2fe' : '#94a3b8' }}>
                          Step {st.step}
                        </span>
                      </div>
                      <span style={{ fontSize: '11px', color: '#e2e8f0', lineHeight: 1.3 }}>
                        {st.title.replace('...', '')}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Terminal Logs View */}
              <div
                style={{
                  backgroundColor: '#030712',
                  border: '1px solid #1e293b',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  color: '#a7f3d0',
                  maxHeight: '180px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', marginBottom: '4px' }}>
                  <Terminal size={12} />
                  <span>Pipeline Live Progress Output:</span>
                </div>
                {pipelineLogs.map((lg, i) => (
                  <div key={i} style={{ wordBreak: 'break-all' }}>
                    {lg}
                  </div>
                ))}
                <div ref={terminalLogEndRef} />
              </div>

              {/* Success Action Banner */}
              {pipelineCompletedModel && (
                <div
                  style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid #059669',
                    borderRadius: '8px',
                    padding: '14px 18px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#f8fafc' }}>
                      Ready to Chat: {pipelineCompletedModel.name}
                    </h4>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#6ee7b7' }}>
                      Guide file merged. Model is verified and active in the Gateway registry.
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => handleChatWithModel(pipelineCompletedModel.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: '#10b981',
                        color: '#ffffff',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      <MessageSquare size={14} />
                      <span>Chat in Sandbox Now</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsPipelineRunning(false);
                        setActiveTab('installed');
                      }}
                      style={{
                        backgroundColor: '#1e293b',
                        color: '#94a3b8',
                        border: '1px solid #334155',
                        padding: '8px 14px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}

              {pipelineError && (
                <div
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid #ef4444',
                    borderRadius: '8px',
                    padding: '12px',
                    color: '#fca5a5',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <AlertCircle size={16} color="#ef4444" />
                  <span>{pipelineError}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: HUGGING FACE DOWNLOADER */}
      {activeTab === 'hf' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>Popular GGUF Repos:</span>
            {[
              { label: 'Qwen 2.5 Coder 1.5B', repo: 'Qwen/Qwen2.5-Coder-1.5B-Instruct-GGUF' },
              { label: 'DeepSeek R1 Distill 1.5B', repo: 'unsloth/DeepSeek-R1-Distill-Qwen-1.5B-GGUF' },
              { label: 'Llama 3.2 3B', repo: 'bartowski/Llama-3.2-3B-Instruct-GGUF' },
              { label: 'Phi 3.5 Mini', repo: 'bartowski/Phi-3.5-mini-instruct-GGUF' },
            ].map((s) => (
              <button
                key={s.repo}
                type="button"
                onClick={() => {
                  setHfInput(s.repo);
                  handleSearchHf(s.repo);
                }}
                style={{
                  backgroundColor: '#1e293b',
                  color: '#c7d2fe',
                  border: '1px solid #3730a3',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  cursor: 'pointer',
                }}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                type="text"
                placeholder="Enter Hugging Face repo ID (e.g. Qwen/Qwen2.5-Coder-1.5B-Instruct-GGUF) or direct URL"
                value={hfInput}
                onChange={(e) => setHfInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchHf()}
                style={{
                  width: '100%',
                  backgroundColor: '#090d16',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  padding: '10px 14px 10px 36px',
                  color: '#f8fafc',
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
              <Search
                size={16}
                color="#64748b"
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
              />
            </div>

            <button
              type="button"
              onClick={() => handleSearchHf()}
              disabled={isSearchingHf || !hfInput.trim()}
              style={{
                backgroundColor: '#6366f1',
                color: '#ffffff',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Search size={15} />
              <span>{isSearchingHf ? 'Searching...' : 'Explore Models'}</span>
            </button>
          </div>

          {hfSearchError && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid #ef4444',
                padding: '12px',
                borderRadius: '8px',
                color: '#fca5a5',
                fontSize: '13px',
              }}
            >
              <AlertCircle size={16} color="#ef4444" />
              <span>{hfSearchError}</span>
            </div>
          )}

          {hfFiles.length > 0 && (
            <div
              style={{
                backgroundColor: '#090d16',
                borderRadius: '10px',
                border: '1px solid #1e293b',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#0f172a',
                  borderBottom: '1px solid #1e293b',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#f8fafc',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <span>Available Quantizations in {hfInput}</span>
                <span style={{ color: '#94a3b8', fontSize: '12px' }}>{hfFiles.length} files found</span>
              </div>

              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {hfFiles.map((file) => (
                  <div
                    key={file.filename}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 16px',
                      borderBottom: '1px solid #1e293b',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc' }}>
                          {file.filename}
                        </span>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            backgroundColor: '#312e81',
                            color: '#c7d2fe',
                            padding: '2px 6px',
                            borderRadius: '4px',
                          }}
                        >
                          {file.quantization}
                        </span>
                      </div>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>Size: {file.sizeFormatted}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleStartDownload(file)}
                      disabled={!!activeDownload}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: '#6366f1',
                        color: '#ffffff',
                        border: 'none',
                        padding: '6px 14px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: activeDownload ? 'not-allowed' : 'pointer',
                        opacity: activeDownload ? 0.6 : 1,
                      }}
                    >
                      <Download size={13} />
                      <span>Download & Auto-Setup</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MANIFEST INSPECTOR MODAL */}
      {selectedManifestModel && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={() => setSelectedManifestModel(null)}
        >
          <div
            style={{
              backgroundColor: '#0d1322',
              border: '1px solid #334155',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '650px',
              maxHeight: '85vh',
              overflowY: 'auto',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileCode size={20} color="#818cf8" />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>
                  Compiled Manifest: {selectedManifestModel.id}.manifest.json
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedManifestModel(null)}
                style={{
                  backgroundColor: 'transparent',
                  color: '#94a3b8',
                  border: 'none',
                  fontSize: '18px',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>

            {isLoadingManifest ? (
              <div style={{ textAlign: 'center', padding: '30px' }}>
                <Loader2 size={24} className="animate-spin" color="#818cf8" style={{ margin: '0 auto' }} />
              </div>
            ) : manifestData ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>Model Disk Path:</span>
                  <div style={{ fontSize: '12px', fontFamily: 'monospace', color: '#e2e8f0', backgroundColor: '#090d16', padding: '6px 10px', borderRadius: '4px', marginTop: '4px' }}>
                    {manifestData.modelPath}
                  </div>
                </div>

                {manifestData.systemPrompt && (
                  <div>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>Merged Core System Guide:</span>
                    <div style={{ fontSize: '12px', color: '#a7f3d0', backgroundColor: '#090d16', padding: '8px 12px', borderRadius: '4px', marginTop: '4px', whiteSpace: 'pre-wrap' }}>
                      {manifestData.systemPrompt}
                    </div>
                  </div>
                )}

                <div>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>Injected Parameters:</span>
                  <pre
                    style={{
                      margin: '4px 0 0',
                      backgroundColor: '#090d16',
                      padding: '10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      color: '#c7d2fe',
                      overflowX: 'auto',
                    }}
                  >
                    {JSON.stringify(manifestData.parameters, null, 2)}
                  </pre>
                </div>

                <div>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>Architecture & Tensor Metadata:</span>
                  <pre
                    style={{
                      margin: '4px 0 0',
                      backgroundColor: '#090d16',
                      padding: '10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      color: '#cbd5e1',
                      overflowX: 'auto',
                    }}
                  >
                    {JSON.stringify(manifestData.metadata, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <p style={{ color: '#94a3b8', fontSize: '13px' }}>
                No custom manifest compiled yet. The model is currently running on default header parameters.
              </p>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => setSelectedManifestModel(null)}
                style={{
                  backgroundColor: '#1e293b',
                  color: '#f8fafc',
                  border: '1px solid #334155',
                  padding: '7px 16px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Model Settings Modal */}
      {editingModel && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '650px',
              maxHeight: '90vh',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              padding: '24px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit2 size={18} color="#f59e0b" />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#f8fafc' }}>
                  Edit Model Settings: {editingModel.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingModel(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <XCircle size={18} />
              </button>
            </div>

            {/* Form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Display Name */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                  Model Display Name
                </label>
                <input
                  type="text"
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  placeholder="e.g. Qwen 3.5 4B Uncensored (Coder)"
                  style={{
                    width: '100%',
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    color: '#f8fafc',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  File ID: <code style={{ color: '#94a3b8' }}>{editingModel.id}</code>
                </span>
              </div>

              {/* Capabilities & Reasoning */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {/* Reasoning Toggle */}
                <div
                  onClick={() => setEditReasoning(!editReasoning)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    backgroundColor: editReasoning ? 'rgba(168, 85, 247, 0.12)' : '#1e293b',
                    border: editReasoning ? '1px solid #a855f7' : '1px solid #334155',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={editReasoning}
                    onChange={(e) => setEditReasoning(e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: editReasoning ? '#d8b4fe' : '#f8fafc' }}>
                      🧠 Deep Reasoning / Thinking
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                      {editReasoning ? 'Enabled (Generates <think> tags)' : 'Disabled (/no_think mode for fast answers)'}
                    </div>
                  </div>
                </div>

                {/* Vision Capability */}
                <div
                  onClick={() => setEditVision(!editVision)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    backgroundColor: editVision ? 'rgba(56, 189, 248, 0.12)' : '#1e293b',
                    border: editVision ? '1px solid #38bdf8' : '1px solid #334155',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={editVision}
                    onChange={(e) => setEditVision(e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: editVision ? '#7dd3fc' : '#f8fafc' }}>
                      👁️ Vision Multimodal
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                      {editVision ? 'Enabled (Accepts image attachments)' : 'Disabled (Text-only inference)'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Context Size & Temperature */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                    Context Window (Tokens)
                  </label>
                  <select
                    value={editContextSize}
                    onChange={(e) => setEditContextSize(Number(e.target.value))}
                    style={{
                      width: '100%',
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '6px',
                      padding: '8px 10px',
                      color: '#f8fafc',
                      fontSize: '13px',
                    }}
                  >
                    <option value={1024}>1024 (Ultra fast, minimal RAM)</option>
                    <option value={2048}>2048 (Recommended default)</option>
                    <option value={4096}>4096 (Standard balance)</option>
                    <option value={8192}>8192 (Large context)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                    Temperature
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    max="2"
                    value={editTemperature}
                    onChange={(e) => setEditTemperature(parseFloat(e.target.value) || 0.7)}
                    style={{
                      width: '100%',
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '6px',
                      padding: '8px 10px',
                      color: '#f8fafc',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                    Top P
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    max="1"
                    value={editTopP}
                    onChange={(e) => setEditTopP(parseFloat(e.target.value) || 0.9)}
                    style={{
                      width: '100%',
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '6px',
                      padding: '8px 10px',
                      color: '#f8fafc',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              {/* System Guide / Prompt */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                  Model System Guide / Custom Persona Prompt
                </label>
                <textarea
                  rows={4}
                  value={editSystemPrompt}
                  onChange={(e) => setEditSystemPrompt(e.target.value)}
                  placeholder="Enter system instructions or persona for this model..."
                  style={{
                    width: '100%',
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    color: '#f8fafc',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    boxSizing: 'border-box',
                    resize: 'vertical',
                  }}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button
                type="button"
                onClick={() => setEditingModel(null)}
                disabled={isSavingSettings}
                style={{
                  backgroundColor: '#1e293b',
                  color: '#94a3b8',
                  border: '1px solid #334155',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveModelSettings}
                disabled={isSavingSettings}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#f59e0b',
                  color: '#0f172a',
                  border: 'none',
                  padding: '8px 20px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: isSavingSettings ? 'not-allowed' : 'pointer',
                }}
              >
                {isSavingSettings && <Loader2 size={14} className="animate-spin" />}
                <span>{isSavingSettings ? 'Saving...' : 'Save Settings'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import type { ChatMessage } from '../gateway/types';

export interface AgentChatSession {
  id: string;
  name: string;
  modelId: string;
  providerId?: string;
  systemPrompt?: string;
  messages: ChatMessage[];
  isGenerating: boolean;
  reasoningEnabled?: boolean;
  abortController?: AbortController | null;
  createdAt: number;
}
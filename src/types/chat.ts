export type AIProvider = 'openai' | 'anthropic' | 'google' | 'deepseek' | 'openrouter';

export interface AIModel {
  id: string;
  name: string;
  provider: AIProvider;
  description: string;
  inputPrice: number; // per 1M tokens
  outputPrice: number; // per 1M tokens
  color: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  modelId?: string;
  timestamp: Date;
  isStreaming?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  modelId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SynthesisResponse {
  modelId: string;
  modelName: string;
  content: string;
  status: 'pending' | 'streaming' | 'complete' | 'error';
  error?: string;
}

export interface OrchestrationLog {
  id: string;
  modelResponses: SynthesisResponse[];
  synthesizedContent?: string;
  status: 'pending' | 'processing' | 'complete' | 'error';
}

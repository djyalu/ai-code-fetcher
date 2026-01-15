import { AIModel } from '@/types/chat';

export const MODELS: AIModel[] = [
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    description: 'OpenAI의 최신 멀티모달 모델',
    inputPrice: 2.5,
    outputPrice: 10,
    color: '#10a37f',
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'openai',
    description: '빠르고 경제적인 GPT-4o 버전',
    inputPrice: 0.15,
    outputPrice: 0.6,
    color: '#10a37f',
  },
  {
    id: 'claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    description: 'Anthropic의 가장 지능적인 모델',
    inputPrice: 3,
    outputPrice: 15,
    color: '#cc785c',
  },
  {
    id: 'claude-3-5-haiku',
    name: 'Claude 3.5 Haiku',
    provider: 'anthropic',
    description: '빠르고 효율적인 Claude 모델',
    inputPrice: 0.25,
    outputPrice: 1.25,
    color: '#cc785c',
  },
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    provider: 'google',
    description: 'Google의 최신 고속 모델',
    inputPrice: 0.1,
    outputPrice: 0.4,
    color: '#4285f4',
  },
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    provider: 'google',
    description: 'Google의 고성능 멀티모달 모델',
    inputPrice: 1.25,
    outputPrice: 5,
    color: '#4285f4',
  },
  {
    id: 'deepseek-chat',
    name: 'DeepSeek V3',
    provider: 'deepseek',
    description: '중국의 강력한 오픈소스 모델',
    inputPrice: 0.14,
    outputPrice: 0.28,
    color: '#5865f2',
  },
];

export const SYNTHESIS_MODELS = ['gpt-4o', 'claude-3-5-sonnet', 'gemini-2.0-flash', 'deepseek-chat'];

export const DEFAULT_SYSTEM_PROMPT = `You are a helpful AI assistant. Respond concisely and accurately.`;

export const SYNTHESIS_PROMPT = `You are an expert synthesizer. You will receive responses from multiple AI models to the same question. 
Your task is to analyze all responses and create a comprehensive, accurate synthesis that:
1. Identifies the best insights from each response
2. Resolves any contradictions between responses
3. Provides a clear, well-structured final answer
4. Maintains accuracy while being concise

Present the synthesized response in a clear format.`;

export const getModelById = (id: string): AIModel | undefined => {
  return MODELS.find(model => model.id === id);
};

export const getModelsByProvider = (provider: string): AIModel[] => {
  return MODELS.filter(model => model.provider === provider);
};

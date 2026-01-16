import { AIModel } from '@/types/chat';

export const MODELS: AIModel[] = [
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    description: 'OpenAI의 최신 멀티모달 모델',
    inputPrice: 2.5,
    outputPrice: 10,
    contextWindow: 128000,
    color: '#10a37f',
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'openai',
    description: '빠르고 경제적인 GPT-4o 버전',
    inputPrice: 0.15,
    outputPrice: 0.6,
    contextWindow: 128000,
    color: '#10a37f',
  },
  {
    id: 'claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    description: 'Anthropic의 가장 지능적인 모델',
    inputPrice: 3,
    outputPrice: 15,
    contextWindow: 200000,
    color: '#cc785c',
  },
  {
    id: 'claude-3-5-haiku',
    name: 'Claude 3.5 Haiku',
    provider: 'anthropic',
    description: '빠르고 효율적인 Claude 모델',
    inputPrice: 0.25,
    outputPrice: 1.25,
    contextWindow: 200000,
    color: '#cc785c',
  },
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    provider: 'google',
    description: 'Google의 최신 고속 모델',
    inputPrice: 0.1,
    outputPrice: 0.4,
    contextWindow: 1048576,
    color: '#4285f4',
  },
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    provider: 'google',
    description: 'Google의 고성능 멀티모달 모델',
    inputPrice: 1.25,
    outputPrice: 5,
    contextWindow: 2097152,
    color: '#4285f4',
  },
  {
    id: 'deepseek-chat',
    name: 'DeepSeek V3',
    provider: 'deepseek',
    description: '중국의 강력한 오픈소스 모델',
    inputPrice: 0.14,
    outputPrice: 0.28,
    contextWindow: 64000,
    color: '#5865f2',
  },
  {
    id: 'perplexity/sonar',
    name: 'Perplexity Sonar',
    provider: 'perplexity',
    description: '최신 정보 검색에 특화된 추론 모델',
    inputPrice: 1,
    outputPrice: 1,
    contextWindow: 128000,
    color: '#20b2aa',
  },
  {
    id: 'perplexity/sonar-deep-research',
    name: 'Sonar Deep Research',
    provider: 'perplexity',
    description: '심층 학술 및 탐사 연구를 위한 고성능 검색 모델',
    inputPrice: 2,
    outputPrice: 2,
    contextWindow: 128000,
    color: '#008080',
  },
  // Free Research Models
  {
    id: 'google/gemini-2.0-flash-exp:free',
    name: 'Gemini 2.0 Flash (Free)',
    provider: 'google',
    description: '최강 가성비. 긴 문서를 한 번에 읽고 정보를 찾는 데 압도적 1위입니다.',
    inputPrice: 0,
    outputPrice: 0,
    contextWindow: 1048576,
    color: '#34a853',
  },
  {
    id: 'meta-llama/llama-3.3-70b-instruct:free',
    name: 'Llama 3.3 70B (Free)',
    provider: 'meta',
    description: '범용성. 가장 표준적이고 안정적인 성능을 보여주는 대규모 오픈 소스 모델입니다.',
    inputPrice: 0,
    outputPrice: 0,
    contextWindow: 128000,
    color: '#0668E1',
  },
  {
    id: 'deepseek/deepseek-chat:free',
    name: 'DeepSeek V3 (Free)',
    provider: 'deepseek',
    description: 'DeepSeek V3의 무료 버전. 코딩과 논리적 추론에 강점이 있습니다.',
    inputPrice: 0,
    outputPrice: 0,
    contextWindow: 64000,
    color: '#5865f2',
  },
  {
    id: 'qwen/qwen-2.5-72b-instruct:free',
    name: 'Qwen 2.5 72B (Free)',
    provider: 'qwen',
    description: '코딩 및 수학 성능이 뛰어난 고성능 오픈 모델입니다.',
    inputPrice: 0,
    outputPrice: 0,
    contextWindow: 32768,
    color: '#410ba0',
  },
  {
    id: 'xiaomi/mimo-v2-flash:free',
    name: 'Xiaomi MiMo V2 (Free)',
    provider: 'xiaomi',
    description: '샤오미의 최신 경량 모델. 빠르고 효율적인 응답을 제공합니다 (128k 컨텍스트).',
    inputPrice: 0,
    outputPrice: 0,
    contextWindow: 128000,
    color: '#ff6900',
  },
  {
    id: 'nvidia/nemotron-3-nano-30b-a3b:free',
    name: 'NVIDIA Nemotron 3 (Free)',
    provider: 'nvidia',
    description: '엔비디아의 정밀 모델. RAG와 정보 추출 작업에 특화되어 있습니다.',
    inputPrice: 0,
    outputPrice: 0,
    contextWindow: 131072,
    color: '#76b900',
  },
];

export const SYNTHESIS_MODELS = ['google/gemini-2.0-flash-exp:free', 'qwen/qwen-2.5-72b-instruct:free', 'meta-llama/llama-3.3-70b-instruct:free'];

export const DEFAULT_SYSTEM_PROMPT = `You are a helpful AI assistant. Respond concisely and accurately.`;

export const SYNTHESIS_PROMPT = `You are an expert synthesizer and data analyst. You will receive responses from multiple AI models to the same user question.
Your task is to create a comprehensive synthesis that adds meta-analysis of the model responses.

Structure your response as follows:
1. ✨ **Master Synthesis**: A comprehensive final answer that resolves contradictions and provides the most accurate conclusion.
2. 🔍 **Model Comparison Analysis**:
   - **Similarities (공통점)**: Key points that all or most models agreed upon.
   - **Differences (차이점)**: Unique insights or different perspectives provided by specific models.
3. ⚖️ **Conflict & Ratio (상충 정보 및 비율)**: If models provide conflicting information, explicitly state the ratio (e.g., "3 out of 5 models (60%) suggest X, while 2 models (40%) suggest Y").
4. 💾 **Key Takeaways**: A quick summary of the most critical facts identified across the orchestration.

Ensure the final result is easy to read using Markdown tables, lists, and bold text. The language of the response should match the language of the user's question (default to Korean if unsure).`;

export const getModelById = (id: string): AIModel | undefined => {
  return MODELS.find(model => model.id === id);
};

export const getModelsByProvider = (provider: string): AIModel[] => {
  return MODELS.filter(model => model.provider === provider);
};

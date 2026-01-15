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
    id: 'nvidia/llama-3.1-nemotron-70b-instruct:free',
    name: 'Nemotron 70B',
    provider: 'nvidia',
    description: '정밀 추출. 팩트 중심의 정보 추출과 빠른 응답 속도가 강점입니다.',
    inputPrice: 0,
    outputPrice: 0,
    contextWindow: 131072,
    color: '#76b900',
  },
  {
    id: 'qwen/qwen-2.5-72b-instruct:free',
    name: 'Qwen 2.5 72B',
    provider: 'qwen',
    description: '기술 검색. 검색 내용 중 코드가 포함되어 있거나 기술적 설명이 필요할 때 좋습니다.',
    inputPrice: 0,
    outputPrice: 0,
    contextWindow: 131072,
    color: '#615ced',
  },
  {
    id: 'mistralai/mistral-small-3.1-24b-instruct:free',
    name: 'Mistral Small 3.1',
    provider: 'mistral',
    description: '지침 준수. 출력 형식을 엄격하게 지켜야 하는(예: JSON 추출) 작업에 유리합니다.',
    inputPrice: 0,
    outputPrice: 0,
    contextWindow: 131072,
    color: '#fd6f00',
  },
  {
    id: 'deepseek/deepseek-chat-v3-0324:free',
    name: 'DeepSeek V3 (Free)',
    provider: 'deepseek',
    description: '부드러운 요약. 자연스러운 문체로 검색 결과를 재구성해주는 능력이 뛰어납니다.',
    inputPrice: 0,
    outputPrice: 0,
    contextWindow: 131072,
    color: '#5865f2',
  },
  {
    id: 'google/gemma-3-27b-it:free',
    name: 'Gemma 3 27B',
    provider: 'google',
    description: '멀티모달 검색. 텍스트뿐 아니라 이미지 속 정보를 검색/분석할 때 유용합니다.',
    inputPrice: 0,
    outputPrice: 0,
    contextWindow: 131072,
    color: '#4285f4',
  },
  {
    id: 'meta-llama/llama-3.3-70b-instruct:free',
    name: 'Llama 3.3 70B',
    provider: 'meta',
    description: '범용성. 가장 표준적이고 안정적인 성능을 보여주는 대규모 오픈 소스 모델입니다.',
    inputPrice: 0,
    outputPrice: 0,
    contextWindow: 131072,
    color: '#0668E1',
  },
  {
    id: 'microsoft/phi-4:free',
    name: 'Phi-4',
    provider: 'microsoft',
    description: '심층 사고. 답변 전 내부 추론 과정을 거쳐 더 깊이 있는 분석 결과를 내놓습니다.',
    inputPrice: 0,
    outputPrice: 0,
    contextWindow: 16384,
    color: '#00bcf2',
  },
];

export const SYNTHESIS_MODELS = ['google/gemini-2.0-flash-exp:free', 'nvidia/llama-3.1-nemotron-70b-instruct:free', 'meta-llama/llama-3.3-70b-instruct:free'];

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

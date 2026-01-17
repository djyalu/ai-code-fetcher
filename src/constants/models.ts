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
  // Free Research Models
  {
    id: 'google/gemini-2.0-flash-exp:free',
    name: 'Gemini 2.0 Flash (Free)',
    provider: 'google',
    description: '구글 최신 모델. 긴 문맥(1M) 처리와 빠른 속도를 자랑하는 가성비 최고의 모델.',
    inputPrice: 0,
    outputPrice: 0,
    contextWindow: 1048576,
    color: '#34a853',
  },
  {
    id: 'meta-llama/llama-3.3-70b-instruct:free',
    name: 'Llama 3.3 70B (Free)',
    provider: 'meta',
    description: '메타의 강력한 오픈소스 모델. 범용적인 작업에서 매우 안정적인 성능을 발휘합니다.',
    inputPrice: 0,
    outputPrice: 0,
    contextWindow: 128000,
    color: '#0668E1',
  },
  {
    id: 'deepseek/deepseek-r1-0528:free',
    name: 'DeepSeek R1 (Free)',
    provider: 'deepseek',
    description: 'DeepSeek의 최신 추론 모델. R1 아키텍처를 적용하여 논리적 사고 능력이 강화되었습니다.',
    inputPrice: 0,
    outputPrice: 0,
    contextWindow: 64000,
    color: '#5865f2',
  },
  {
    id: 'nvidia/nemotron-3-nano-30b-a3b:free',
    name: 'Nemotron 3 30B (Free)',
    provider: 'nvidia',
    description: '엔비디아의 정밀 모델. RAG 시스템과 데이터 추출 작업에 뛰어난 성능을 보입니다.',
    inputPrice: 0,
    outputPrice: 0,
    contextWindow: 131072,
    color: '#76b900',
  },
  {
    id: 'mistralai/devstral-2512:free',
    name: 'Mistral Devstral (Free)',
    provider: 'mistral',
    description: 'Mistral의 개발자용 실험 모델. 코딩 및 기술적인 작업에 적합합니다.',
    inputPrice: 0,
    outputPrice: 0,
    contextWindow: 32000,
    color: '#fd6f00',
  },
  {
    id: 'arcee-ai/trinity-mini:free',
    name: 'Arcee Trinity Mini (Free)',
    provider: 'arcee',
    description: 'Arcee AI의 소형 고성능 모델. 특화된 도메인 지식과 빠른 추론 속도가 특징입니다.',
    inputPrice: 0,
    outputPrice: 0,
    contextWindow: 32000,
    color: '#8b5cf6',
  },
  {
    id: 'nvidia/nemotron-nano-9b-v2:free',
    name: 'Nemotron Nano 9B (Free)',
    provider: 'nvidia',
    description: '엔비디아의 초경량 모델. 매우 빠른 응답 속도로 간단한 질의응답에 적합합니다.',
    inputPrice: 0,
    outputPrice: 0,
    contextWindow: 32000,
    color: '#76b900',
  },
  {
    id: 'openai/gpt-oss-120b:free',
    name: 'GPT-OSS 120B (Free)',
    provider: 'openai',
    description: '오픈소스 기반 대형 언어 모델. GPT 계열의 성능을 무료로 체험할 수 있습니다.',
    inputPrice: 0,
    outputPrice: 0,
    contextWindow: 8192,
    color: '#10a37f',
  },
  {
    id: 'mistralai/mistral-small-3.1-24b-instruct:free',
    name: 'Mistral Small 3.1 (Free)',
    provider: 'mistral',
    description: 'Mistral의 효율적인 중형 모델. 지시 이행 능력과 응답 품질의 균형이 좋습니다.',
    inputPrice: 0,
    outputPrice: 0,
    contextWindow: 32000,
    color: '#fd6f00',
  },
  {
    id: 'google/gemma-3-27b-it:free',
    name: 'Gemma 3 27B (Free)',
    provider: 'google',
    description: '구글의 오픈 웨이트 모델. 27B 파라미터로 뛰어난 성능과 효율성을 제공합니다.',
    inputPrice: 0,
    outputPrice: 0,
    contextWindow: 131072,
    color: '#4285f4',
  },
];

export const SYNTHESIS_MODELS = ['google/gemma-3-27b-it:free', 'google/gemini-2.0-flash-exp:free'];

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

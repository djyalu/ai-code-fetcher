import { AIModel } from '@/types/chat';

export const MODELS: AIModel[] = [
  // ============= Premium Models - Frontier =============
  {
    id: 'gpt-5.2',
    name: 'GPT-5.2',
    provider: 'openai',
    description: '최고 성능. Agentic Workflow 및 초장문 맥락 이해.',
    inputPrice: 10,
    outputPrice: 30,
    contextWindow: 128000,
    color: '#10a37f',
  },
  {
    id: 'gpt-5.2-codex',
    name: 'GPT-5.2 Codex',
    provider: 'openai',
    description: '코딩 최강. 복잡한 엔지니어링 및 아키텍처 설계용.',
    inputPrice: 15,
    outputPrice: 45,
    contextWindow: 128000,
    color: '#10a37f',
  },
  {
    id: 'claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    description: '자연스러운 문장력, 코딩, 추론 밸런스가 가장 좋음.',
    inputPrice: 3,
    outputPrice: 15,
    contextWindow: 200000,
    color: '#cc785c',
  },
  {
    id: 'gemini-3-flash-preview',
    name: 'Gemini 3 Flash',
    provider: 'google',
    description: '차세대 Gemini. 초고속 추론 및 1M+ 컨텍스트.',
    inputPrice: 0.5,
    outputPrice: 1.5,
    contextWindow: 1048576,
    color: '#4285f4',
  },
  {
    id: 'llama-4-maverick',
    name: 'Llama 4 Maverick',
    provider: 'meta',
    description: '400B MoE 아키텍처. 방대한 지식과 추론 능력.',
    inputPrice: 2,
    outputPrice: 6,
    contextWindow: 256000,
    color: '#0668E1',
  },

  // ============= Premium Models - High Efficiency =============
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'openai',
    description: 'GPT-4o 수준의 지능을 매우 저렴하게 제공.',
    inputPrice: 0.15,
    outputPrice: 0.6,
    contextWindow: 128000,
    color: '#10a37f',
  },
  {
    id: 'deepseek-chat',
    name: 'DeepSeek V3',
    provider: 'deepseek',
    description: '가성비 갑. 코딩 및 한국어 성능이 매우 뛰어남.',
    inputPrice: 0.14,
    outputPrice: 0.28,
    contextWindow: 64000,
    color: '#5865f2',
  },
  {
    id: 'gemini-2.5-flash-lite',
    name: 'Gemini 2.5 Flash Lite',
    provider: 'google',
    description: '극도로 저렴하고 빠름. 단순 질의응답에 적합.',
    inputPrice: 0.075,
    outputPrice: 0.3,
    contextWindow: 1048576,
    color: '#4285f4',
  },
  {
    id: 'claude-3-5-haiku',
    name: 'Claude 3.5 Haiku',
    provider: 'anthropic',
    description: 'Claude 특유의 톤앤매너를 유지하며 속도 향상.',
    inputPrice: 0.25,
    outputPrice: 1.25,
    contextWindow: 200000,
    color: '#cc785c',
  },

  // ============= Free Models =============
  {
    id: 'google/gemini-2.0-flash-exp:free',
    name: 'Gemini 2.0 Flash (Free)',
    provider: 'google',
    description: '강력 추천. 1M 긴 문맥처리와 빠른 속도. 멀티모달 지원.',
    inputPrice: 0,
    outputPrice: 0,
    contextWindow: 1048576,
    color: '#34a853',
  },
  {
    id: 'meta-llama/llama-3.3-70b-instruct:free',
    name: 'Llama 3.3 70B (Free)',
    provider: 'meta',
    description: '범용적으로 가장 안정적인 오픈소스 모델. 한국어 처리 우수.',
    inputPrice: 0,
    outputPrice: 0,
    contextWindow: 128000,
    color: '#0668E1',
  },
  {
    id: 'deepseek/deepseek-r1-0528:free',
    name: 'DeepSeek R1 (Free)',
    provider: 'deepseek',
    description: '추론 특화. CoT(Chain of Thought) 능력이 강화된 최신 모델.',
    inputPrice: 0,
    outputPrice: 0,
    contextWindow: 64000,
    color: '#5865f2',
  },
  {
    id: 'xiaomi/mimo-v2-flash:free',
    name: 'Xiaomi MiMo V2 (Free)',
    provider: 'xiaomi',
    description: '모바일/엣지 환경 최적화. 가볍고 빠름.',
    inputPrice: 0,
    outputPrice: 0,
    contextWindow: 128000,
    color: '#ff6900',
  },
  {
    id: 'qwen/qwen3-coder:free',
    name: 'Qwen 3 Coder (Free)',
    provider: 'alibaba',
    description: '코딩 특화. 코드 생성 및 분석에 최적화됨.',
    inputPrice: 0,
    outputPrice: 0,
    contextWindow: 32000,
    color: '#6366f1',
  },
  {
    id: 'mistralai/devstral-2512:free',
    name: 'Mistral Devstral (Free)',
    provider: 'mistral',
    description: '개발자용 실험 모델. 코딩 및 기술적인 작업에 적합.',
    inputPrice: 0,
    outputPrice: 0,
    contextWindow: 32000,
    color: '#fd6f00',
  },
  {
    id: 'openai/gpt-oss-120b:free',
    name: 'GPT-OSS 120B (Free)',
    provider: 'openai',
    description: '오픈소스 기반 대형 언어 모델. GPT 계열의 성능을 무료로 체험.',
    inputPrice: 0,
    outputPrice: 0,
    contextWindow: 8192,
    color: '#10a37f',
  },
  {
    id: 'google/gemma-3-27b-it:free',
    name: 'Gemma 3 27B (Free)',
    provider: 'google',
    description: '구글의 고성능 오픈 웨이트 모델. 뛰어난 성능과 효율성.',
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

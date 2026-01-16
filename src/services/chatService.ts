import { supabase } from '@/integrations/supabase/client';
// Chat Service: Handles interactions with OpenRouter and Perplexity APIs
import { DEFAULT_SYSTEM_PROMPT, SYNTHESIS_PROMPT, SYNTHESIS_MODELS, getModelById } from '@/constants/models';

// Synthesis 합성 모델 상수
const FREE_SYNTHESIS_MODEL = 'qwen/qwen-2.5-72b-instruct:free';
const PREMIUM_SYNTHESIS_MODEL = 'gemini-2.0-flash';

// 유료 모델 포함 여부 확인
export const hasPremiumModel = (modelIds: string[]): boolean => {
  return modelIds.some(id => {
    const model = getModelById(id);
    return model && (model.inputPrice > 0 || model.outputPrice > 0);
  });
};

interface ChatResponse {
  content: string;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export const sendMessage = async (
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
  model: string
): Promise<ChatResponse> => {
  const isPerplexity = model.startsWith('perplexity/') || model.includes('sonar');

  const endpoint = isPerplexity
    ? 'https://api.perplexity.ai/chat/completions'
    : 'https://openrouter.ai/api/v1/chat/completions';

  // Try to retrieve keys from various potential sources (Vite standard, or direct env injection)
  const openRouterKey = import.meta.env.VITE_OPENROUTER_API_KEY || import.meta.env.OPENROUTER_API_KEY;
  const perplexityKey = import.meta.env.VITE_PERPLEXITY_API_KEY || import.meta.env.PERPLEXITY_API_KEY;

  const apiKey = isPerplexity ? perplexityKey : openRouterKey;

  if (!apiKey) {
    console.warn(`${isPerplexity ? 'Perplexity' : 'OpenRouter'} API key is missing in environment variables. Request might fail.`);
    // We will attempt the request anyway, as some platforms might inject auth headers via proxy.
  }

  // STRICT RULE: Perplexity models must NEVER be routed to OpenRouter.
  // There is no fallback for Perplexity models to OpenRouter.
  if (isPerplexity && endpoint.includes('openrouter.ai')) {
    throw new Error('Security Error: Attempted to route Perplexity model to OpenRouter. Aborting.');
  }

  // Perplexity API requires model ID modification (strip prefix if stored as perplexity/sonar)
  let targetModel = model;
  if (isPerplexity && targetModel.startsWith('perplexity/')) {
    targetModel = targetModel.replace('perplexity/', '');
  }

  const finalMessages = [
    { role: 'system', content: DEFAULT_SYSTEM_PROMPT },
    ...messages
  ];

  try {
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    };

    // Only add custom headers for OpenRouter (Perplexity might reject unknown headers)
    if (!isPerplexity) {
      headers['HTTP-Referer'] = 'https://github.com/djyalu/ai-code-fetcher';
      headers['X-Title'] = 'AI Code Fetcher';
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: targetModel,
        messages: finalMessages,
        stream: false,
        // Perplexity specific options could go here if needed, but standard chat completion is fine
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData?.error?.message || errorData?.error || `HTTP Error ${response.status}`;

      // Rate Limit Handling
      if (response.status === 429 || errorMessage.includes('Rate limit')) {
        throw new Error('현재 선택한 모델이 요청 한도에 도달했습니다. 잠시 후 다시 시도하거나 다른 모델로 변경해 주세요.');
      }

      throw new Error(errorMessage);
    }

    const data = await response.json();

    if (!data.choices || data.choices.length === 0) {
      throw new Error('No response content received from AI provider.');
    }

    return {
      content: data.choices[0].message.content,
      model: data.model,
      usage: data.usage,
    };
  } catch (error: any) {
    console.error('Chat Service Error:', error);
    throw error;
  }
};

export const sendSynthesisRequest = async (
  userMessage: string,
  conversationHistory: { role: 'user' | 'assistant' | 'system'; content: string }[],
  synthesisModelIds: string[] = SYNTHESIS_MODELS
): Promise<{
  responses: { modelId: string; content: string }[];
  synthesis: string;
}> => {
  const messages = [
    ...conversationHistory,
    { role: 'user' as const, content: userMessage },
  ];

  // Query synthesis models with concurrency limit (3 at a time).
  const chunkSize = 3;
  const results: { modelId: string; content: string; error: string | null }[] = [];

  for (let i = 0; i < synthesisModelIds.length; i += chunkSize) {
    const chunk = synthesisModelIds.slice(i, i + chunkSize);
    const chunkPromises = chunk.map(async (modelId) => {
      try {
        const response = await sendMessage(messages, modelId);
        return { modelId, content: response.content, error: null };
      } catch (error) {
        console.error(`Error from ${modelId}:`, error);
        return { modelId, content: '', error: (error as Error).message };
      }
    });

    const chunkResults = await Promise.all(chunkPromises);
    results.push(...chunkResults);
    // small delay between chunks to reduce burst pressure
    if (i + chunkSize < synthesisModelIds.length) {
      await new Promise(resolve => setTimeout(resolve, 250));
    }
  }

  const successfulResponses = results.filter(r => !r.error && r.content);

  // Generate synthesis using Gemini
  const synthesisPrompt = `${SYNTHESIS_PROMPT}

User Question: ${userMessage}

Model Responses:
${successfulResponses.map(r => `### ${r.modelId}\n${r.content}`).join('\n\n')}

Please synthesize the above responses into a comprehensive answer.`;

  // 선택된 모델에 유료 모델이 포함되어 있는지 확인하여 합성 모델 결정
  const synthesisModel = hasPremiumModel(synthesisModelIds)
    ? PREMIUM_SYNTHESIS_MODEL  // 유료 모델 포함 시: Gemini 2.0 Flash
    : FREE_SYNTHESIS_MODEL;    // 무료 모델만: DeepSeek V3 Free

  const synthesisResponse = await sendMessage(
    [{ role: 'user', content: synthesisPrompt }],
    synthesisModel
  );

  return {
    responses: successfulResponses.map(r => ({ modelId: r.modelId, content: r.content })),
    synthesis: synthesisResponse.content,
  };
};

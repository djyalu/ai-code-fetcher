import { supabase } from '@/integrations/supabase/client';
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
  const { data, error } = await supabase.functions.invoke('chat', {
    body: {
      messages: [
        { role: 'system', content: DEFAULT_SYSTEM_PROMPT },
        ...messages,
      ],
      model,
      stream: false,
    },
  });

  if (error) {
    // supabase-js may surface non-2xx responses as a generic FunctionsHttpError.
    // Try to pull status/body from the error context so we can show actionable messages.
    const err: any = error;
    const status: number | undefined = err?.context?.status ?? err?.status;

    let extractedMessage: string | undefined;
    const body = err?.context?.body;

    if (typeof body === 'string') {
      try {
        const parsed = JSON.parse(body);
        extractedMessage = parsed?.error || parsed?.message;
      } catch {
        extractedMessage = body;
      }
    } else if (body && typeof body === 'object') {
      extractedMessage = body?.error || body?.message;
    }

    const message = extractedMessage || err?.message || 'Failed to get response';

    const isRateLimit = status === 429 || message.includes('Rate limit exceeded') || message.includes('returned 429');
    if (isRateLimit) {
      // Try to pull the reset epoch (ms) from "...reset (1768521600000)" and show a friendly hint.
      const match = message.match(/reset\s*\((\d{10,})\)/i);
      const resetMs = match ? Number(match[1]) : undefined;
      const resetText = resetMs ? new Date(resetMs).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) : null;

      throw new Error(
        resetText
          ? `현재 선택한 모델이 요청 한도에 도달했습니다. ${resetText} 이후 다시 시도하거나 다른 모델로 변경해 주세요.`
          : '현재 선택한 모델이 요청 한도에 도달했습니다. 잠시 후 다시 시도하거나 다른 모델로 변경해 주세요.'
      );
    }

    console.error('Chat API error:', error);
    throw new Error(message);
  }

  return data as ChatResponse;
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

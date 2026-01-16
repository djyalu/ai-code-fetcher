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
  // Sanitize messages: enforce strict alternation for non-system messages
  const enforceAlternation = (msgs: { role: 'user' | 'assistant' | 'system'; content: string }[]) => {
    const systemMsgs = msgs.filter(m => m.role === 'system').map(m => ({ ...m }));
    const nonSystem = msgs.filter(m => m.role !== 'system').map(m => ({ ...m }));

    // Merge consecutive same-role messages
    const merged: { role: 'user' | 'assistant'; content: string }[] = [];
    for (const m of nonSystem) {
      if (m.role === 'system') continue; // defensive
      const last = merged[merged.length - 1];
      if (last && last.role === m.role) {
        last.content = `${last.content}\n\n${m.content}`;
      } else {
        // m.role is narrowed to 'user' | 'assistant' by the guard above
        merged.push({ role: m.role as 'user' | 'assistant', content: m.content });
      }
    }

    // If first non-system is assistant, prepend a small synthetic user placeholder
    if (merged.length > 0 && merged[0].role === 'assistant') {
      merged.unshift({ role: 'user', content: '[이전 대화 요약] 앞선 AI 응답이 먼저 있습니다.' });
    }

    // Ensure alternation by collapsing any accidental same-role neighbors
    const alternated: { role: 'user' | 'assistant'; content: string }[] = [];
    for (const m of merged) {
      const last = alternated[alternated.length - 1];
      if (last && last.role === m.role) {
        last.content = `${last.content}\n\n${m.content}`;
      } else {
        alternated.push({ role: m.role, content: m.content });
      }
    }

    // Return: system messages first (preserve order), then alternated non-system
    return [...systemMsgs, ...alternated];
  };

  const sanitizedNonSystemMessages = enforceAlternation(messages);

  // Call the Edge Function with a client-side timeout to avoid hanging requests
  const invokePromise = supabase.functions.invoke('chat', {
    body: {
      messages: [
        { role: 'system', content: DEFAULT_SYSTEM_PROMPT },
        ...sanitizedNonSystemMessages,
      ],
      model,
      stream: false,
    },
  }) as Promise<any>;

  const timeoutMs = 15000;
  let invokeResult: any;
  try {
    invokeResult = await Promise.race([
      invokePromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Function call timed out')), timeoutMs)),
    ]);
  } catch (e) {
    console.error('Function invoke timeout or error:', e);
    throw new Error('요청이 시간 초과되었습니다. 잠시 후 다시 시도해 주세요.');
  }

  const { data, error } = invokeResult;

  if (error) {
    // supabase-js may surface non-2xx responses as a generic FunctionsHttpError.
    // Try to pull status/body from the error context so we can show actionable messages.
    const err: any = error;
    const status: number | undefined = err?.context?.status ?? err?.status;

    // Parse standardized JSON error if present: { error_code?, message, detail? }
    let extractedMessage: string | undefined;
    let errorCode: string | undefined;
    const body = err?.context?.body;

    if (typeof body === 'string') {
      try {
        const parsed = JSON.parse(body);
        extractedMessage = parsed?.message || parsed?.error || undefined;
        errorCode = parsed?.error_code || undefined;
      } catch {
        extractedMessage = body;
      }
    } else if (body && typeof body === 'object') {
      extractedMessage = body?.message || body?.error;
      errorCode = body?.error_code;
    }

    const message = extractedMessage || err?.message || 'Failed to get response';

    const isRateLimit = status === 429 || /rate limit/i.test(message) || errorCode === 'rate_limited';
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

    // Map common error codes/statuses to friendly Korean messages when possible
    if (status === 401 || errorCode === 'auth_required') {
      throw new Error('이 모델은 인증된 사용자만 사용할 수 있습니다. 로그인 후 시도하세요.');
    }
    if (status === 403 || errorCode === 'forbidden') {
      throw new Error('선택하신 모델에 접근 권한이 없습니다. 관리자 권한이 필요할 수 있습니다.');
    }
    if (status === 503 || errorCode === 'model_unavailable') {
      throw new Error('현재 선택한 모델이 사용 불가 상태입니다. 잠시 후 다시 시도해 주세요.');
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

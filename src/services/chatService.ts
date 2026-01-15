import { supabase } from '@/integrations/supabase/client';
import { Message } from '@/types/chat';
import { DEFAULT_SYSTEM_PROMPT, SYNTHESIS_PROMPT, SYNTHESIS_MODELS } from '@/constants/models';

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
    console.error('Chat API error:', error);
    throw new Error(error.message || 'Failed to get response');
  }

  return data as ChatResponse;
};

export const sendSynthesisRequest = async (
  userMessage: string,
  conversationHistory: { role: 'user' | 'assistant' | 'system'; content: string }[]
): Promise<{
  responses: { modelId: string; content: string }[];
  synthesis: string;
}> => {
  const messages = [
    ...conversationHistory,
    { role: 'user' as const, content: userMessage },
  ];

  // Query all synthesis models in parallel
  const modelPromises = SYNTHESIS_MODELS.map(async (modelId) => {
    try {
      const response = await sendMessage(messages, modelId);
      return { modelId, content: response.content, error: null };
    } catch (error) {
      console.error(`Error from ${modelId}:`, error);
      return { modelId, content: '', error: (error as Error).message };
    }
  });

  const results = await Promise.all(modelPromises);
  const successfulResponses = results.filter(r => !r.error && r.content);

  // Generate synthesis using Gemini
  const synthesisPrompt = `${SYNTHESIS_PROMPT}

User Question: ${userMessage}

Model Responses:
${successfulResponses.map(r => `### ${r.modelId}\n${r.content}`).join('\n\n')}

Please synthesize the above responses into a comprehensive answer.`;

  const synthesisResponse = await sendMessage(
    [{ role: 'user', content: synthesisPrompt }],
    'gemini-2.0-flash'
  );

  return {
    responses: successfulResponses.map(r => ({ modelId: r.modelId, content: r.content })),
    synthesis: synthesisResponse.content,
  };
};

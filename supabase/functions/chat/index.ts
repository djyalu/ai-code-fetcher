// Multi AI Chat Edge Function

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface RequestBody {
  messages: ChatMessage[];
  model: string;
  stream?: boolean;
}

const MODEL_MAP: Record<string, string> = {
  'gpt-4o': 'openai/gpt-4o',
  'gpt-4o-mini': 'openai/gpt-4o-mini',
  'claude-3-5-sonnet': 'anthropic/claude-3.5-sonnet',
  'claude-3-5-haiku': 'anthropic/claude-3.5-haiku',
  'gemini-2.0-flash': 'google/gemini-2.0-flash-exp:free',
  'gemini-1.5-pro': 'google/gemini-pro-1.5',
  'deepseek-chat': 'deepseek/deepseek-chat',
  
  // Free models - using correct OpenRouter IDs
  'google/gemini-2.0-flash-exp:free': 'google/gemini-2.0-flash-exp:free',
  'nvidia/llama-3.1-nemotron-70b-instruct:free': 'nvidia/llama-3.1-nemotron-70b-instruct:free',
  'qwen/qwen-2.5-72b-instruct:free': 'qwen/qwen-2.5-72b-instruct:free',
  'mistralai/mistral-small-3.1-24b-instruct:free': 'mistralai/mistral-small-3.1-24b-instruct:free',
  'deepseek/deepseek-chat-v3-0324:free': 'deepseek/deepseek-chat-v3-0324:free',
  'google/gemma-3-27b-it:free': 'google/gemma-3-27b-it:free',
  'meta-llama/llama-3.3-70b-instruct:free': 'meta-llama/llama-3.3-70b-instruct:free',
  'microsoft/phi-4:free': 'microsoft/phi-4:free',
  
  'perplexity/sonar': 'perplexity/sonar',
  'perplexity/sonar-deep-research': 'perplexity/sonar-deep-research',
};

function sanitizeMessagesForModel(model: string, messages: ChatMessage[]): ChatMessage[] {
  // Some upstream providers (notably Google AI Studio for Gemma IT) reject "developer/system" instructions.
  // When we detect those models, we remove system messages and fold them into the first user message.
  if (model.includes('google/gemma-3-27b-it')) {
    const systemText = messages
      .filter((m) => m.role === 'system')
      .map((m) => m.content)
      .join('\n');

    const nonSystem = messages.filter((m) => m.role !== 'system');

    if (!systemText) return nonSystem;

    if (nonSystem.length > 0 && nonSystem[0].role === 'user') {
      return [
        {
          role: 'user',
          content: `${systemText}\n\n${nonSystem[0].content}`,
        },
        ...nonSystem.slice(1),
      ];
    }

    return [{ role: 'user', content: systemText }, ...nonSystem];
  }

  return messages;
}

async function callPerplexity(
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  stream: boolean
): Promise<Response> {
  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      stream,
    }),
  });
  return response;
}

async function callOpenRouter(
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  stream: boolean
): Promise<Response> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://lovable.dev',
      'X-Title': 'Multi AI Chat',
    },
    body: JSON.stringify({
      model,
      messages,
      stream,
    }),
  });
  return response;
}

// Helper to detect Perplexity models
function isPerplexityModel(model: string): boolean {
  return model.startsWith('perplexity/') || model === 'sonar' || model === 'sonar-deep-research';
}

// Map Perplexity model IDs to API model names
function getPerplexityModelName(model: string): string {
  if (model === 'perplexity/sonar' || model === 'sonar') return 'sonar';
  if (model === 'perplexity/sonar-deep-research' || model === 'sonar-deep-research') return 'sonar-deep-research';
  // Strip perplexity/ prefix if present
  return model.replace('perplexity/', '');
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, model, stream = false }: RequestBody = await req.json();
    console.log(`Chat request - Model: ${model}, Messages: ${messages.length}, Stream: ${stream}`);

    const mappedModel = MODEL_MAP[model] || model;
    console.log(`Mapped model: ${mappedModel}`);

    // Route Perplexity models directly to Perplexity API
    if (isPerplexityModel(mappedModel)) {
      const perplexityKey = Deno.env.get('PERPLEXITY_API_KEY');
      if (!perplexityKey) {
        console.error('PERPLEXITY_API_KEY not configured');
        throw new Error('Perplexity API key not configured');
      }

      const perplexityModelName = getPerplexityModelName(mappedModel);
      console.log(`Routing to Perplexity API with model: ${perplexityModelName}`);

      const response = await callPerplexity(perplexityKey, perplexityModelName, messages, stream);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Perplexity API error: ${response.status} - ${errorText}`);
        throw new Error(`Perplexity API error: ${response.status}`);
      }

      if (stream) {
        console.log('Returning Perplexity streaming response');
        return new Response(response.body, {
          headers: {
            ...corsHeaders,
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        });
      }

      const data = await response.json();
      console.log('Perplexity chat completion successful');

      return new Response(JSON.stringify({
        content: data.choices?.[0]?.message?.content || '',
        model: data.model,
        usage: data.usage,
        citations: data.citations || [],
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // For non-Perplexity models, use OpenRouter
    const apiKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!apiKey) {
      console.error('OPENROUTER_API_KEY not configured');
      throw new Error('OpenRouter API key not configured');
    }

    const effectiveMessages = sanitizeMessagesForModel(mappedModel, messages);
    if (effectiveMessages !== messages) {
      console.log(
        `Sanitized messages for model ${mappedModel}: ${messages.length} -> ${effectiveMessages.length}`
      );
    }

    // Retry logic with exponential backoff
    const maxRetries = 3;

    class HttpError extends Error {
      status: number;
      constructor(message: string, status: number) {
        super(message);
        this.status = status;
      }
    }

    let lastError: HttpError | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const response = await callOpenRouter(apiKey, mappedModel, effectiveMessages, stream);

      if (response.status === 429) {
        const errorText = await response.text();
        console.warn(`Rate limited (attempt ${attempt + 1}/${maxRetries}): ${errorText}`);

        // If it's a hard daily cap, don't retry (retries just burn time/requests)
        const isDailyLimit = errorText.includes('Daily limit reached') || errorText.includes('limit_rpd');

        if (!isDailyLimit && attempt < maxRetries - 1) {
          // Wait before retry with exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
          continue;
        }

        const resetHeader = response.headers.get('X-RateLimit-Reset');
        lastError = new HttpError(
          resetHeader
            ? `Rate limit exceeded. Try again after reset (${resetHeader}).`
            : 'Rate limit exceeded. Please try again in a few seconds.',
          429
        );
        break;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`OpenRouter API error: ${response.status} - ${errorText}`);

        // Retry transient errors, but preserve the upstream status code
        lastError = new HttpError(`OpenRouter API error: ${response.status}`, response.status);
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
          continue;
        }
        break;
      }

      // Success
      if (stream) {
        console.log('Returning streaming response');
        return new Response(response.body, {
          headers: {
            ...corsHeaders,
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        });
      }

      const data = await response.json();
      console.log('Chat completion successful');

      return new Response(JSON.stringify({
        content: data.choices?.[0]?.message?.content || '',
        model: data.model,
        usage: data.usage,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw lastError || new HttpError('Failed after retries', 500);
  } catch (error: unknown) {
    const status = typeof (error as any)?.status === 'number' ? (error as any).status : 500;

    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error('Error in chat function:', errorMessage);

    return new Response(JSON.stringify({
      error: errorMessage
    }), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

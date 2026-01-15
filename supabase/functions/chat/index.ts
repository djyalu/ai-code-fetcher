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
  'google/gemini-2.0-flash-exp:free': 'google/gemini-2.0-flash-exp:free',
  'xiaomi/mimo-v2-flash:free': 'xiaomi/mimo-v2-flash:free',
  'nvidia/nemotron-3-nano-30b-a3b:free': 'nvidia/nemotron-3-nano-30b-a3b:free',
  'qwen/qwen3-coder-480b-a35b:free': 'qwen/qwen3-coder-480b-a35b:free',
  'mistralai/devstral-2-2512:free': 'mistralai/devstral-2-2512:free',
  'tngtech/r1t-chimera:free': 'tngtech/r1t-chimera:free',
  'allenai/molmo2-8b:free': 'allenai/molmo2-8b:free',
  'meta-llama/llama-3.1-70b-instruct:free': 'meta-llama/llama-3.1-70b-instruct:free',
  'allenai/olmo-3.1-32b-think:free': 'allenai/olmo-3.1-32b-think:free',
  'arcee-ai/trinity-mini:free': 'arcee-ai/trinity-mini:free',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!apiKey) {
      console.error('OPENROUTER_API_KEY not configured');
      throw new Error('OpenRouter API key not configured');
    }

    const { messages, model, stream = false }: RequestBody = await req.json();
    console.log(`Chat request - Model: ${model}, Messages: ${messages.length}, Stream: ${stream}`);

    const openRouterModel = MODEL_MAP[model] || model;
    console.log(`Mapped to OpenRouter model: ${openRouterModel}`);

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://lovable.dev',
        'X-Title': 'Multi AI Chat',
      },
      body: JSON.stringify({
        model: openRouterModel,
        messages,
        stream,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenRouter API error: ${response.status} - ${errorText}`);
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

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
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error('Error in chat function:', errorMessage);
    return new Response(JSON.stringify({
      error: errorMessage
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

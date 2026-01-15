// Model Health Check Edge Function
// Runs daily at 5 AM to check availability of all models

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ModelCheckResult {
  modelId: string;
  isAvailable: boolean;
  errorMessage?: string;
}

// Models to check - OpenRouter models
const OPENROUTER_MODELS = [
  // Free models
  'google/gemini-2.0-flash-exp:free',
  'nvidia/llama-3.1-nemotron-70b-instruct:free',
  'qwen/qwen-2.5-72b-instruct:free',
  'mistralai/mistral-small-3.1-24b-instruct:free',
  'deepseek/deepseek-chat-v3-0324:free',
  'google/gemma-3-27b-it:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'microsoft/phi-4:free',
  // Premium models
  'gpt-4o',
  'gpt-4o-mini',
  'claude-3-5-sonnet',
  'claude-3-5-haiku',
  'gemini-2.0-flash',
  'gemini-1.5-pro',
  'deepseek-chat',
];

// Perplexity models
const PERPLEXITY_MODELS = [
  'sonar',
  'sonar-pro',
  'sonar-reasoning',
  'sonar-reasoning-pro',
  'sonar-deep-research',
];

const OPENROUTER_MODEL_MAP: Record<string, string> = {
  'gpt-4o': 'openai/gpt-4o',
  'gpt-4o-mini': 'openai/gpt-4o-mini',
  'claude-3-5-sonnet': 'anthropic/claude-3.5-sonnet',
  'claude-3-5-haiku': 'anthropic/claude-3.5-haiku',
  'gemini-2.0-flash': 'google/gemini-2.0-flash-exp:free',
  'gemini-1.5-pro': 'google/gemini-pro-1.5',
  'deepseek-chat': 'deepseek/deepseek-chat',
};

async function checkOpenRouterModel(apiKey: string, modelId: string): Promise<ModelCheckResult> {
  const mappedModel = OPENROUTER_MODEL_MAP[modelId] || modelId;
  
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://lovable.dev',
        'X-Title': 'Model Health Check',
      },
      body: JSON.stringify({
        model: mappedModel,
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 5,
      }),
    });

    if (response.ok) {
      return { modelId, isAvailable: true };
    }

    const errorText = await response.text();
    
    // 429 is rate limit - model exists but temporarily unavailable
    if (response.status === 429) {
      return { modelId, isAvailable: true, errorMessage: 'Rate limited but available' };
    }

    // 404 means model doesn't exist or no providers
    if (response.status === 404) {
      return { modelId, isAvailable: false, errorMessage: errorText };
    }

    return { modelId, isAvailable: false, errorMessage: `HTTP ${response.status}: ${errorText}` };
  } catch (error) {
    return { 
      modelId, 
      isAvailable: false, 
      errorMessage: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

async function checkPerplexityModel(apiKey: string, modelId: string): Promise<ModelCheckResult> {
  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelId,
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 5,
      }),
    });

    if (response.ok) {
      return { modelId: `perplexity/${modelId}`, isAvailable: true };
    }

    const errorText = await response.text();
    
    if (response.status === 429) {
      return { modelId: `perplexity/${modelId}`, isAvailable: true, errorMessage: 'Rate limited but available' };
    }

    return { 
      modelId: `perplexity/${modelId}`, 
      isAvailable: false, 
      errorMessage: `HTTP ${response.status}: ${errorText}` 
    };
  } catch (error) {
    return { 
      modelId: `perplexity/${modelId}`, 
      isAvailable: false, 
      errorMessage: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
    const perplexityKey = Deno.env.get('PERPLEXITY_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting model health check...');

    const results: ModelCheckResult[] = [];

    // Check OpenRouter models (with delay to avoid rate limits)
    if (openRouterKey) {
      for (const modelId of OPENROUTER_MODELS) {
        const result = await checkOpenRouterModel(openRouterKey, modelId);
        results.push(result);
        console.log(`${modelId}: ${result.isAvailable ? '✓' : '✗'} ${result.errorMessage || ''}`);
        // Small delay between checks
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // Check Perplexity models
    if (perplexityKey) {
      for (const modelId of PERPLEXITY_MODELS) {
        const result = await checkPerplexityModel(perplexityKey, modelId);
        results.push(result);
        console.log(`${result.modelId}: ${result.isAvailable ? '✓' : '✗'} ${result.errorMessage || ''}`);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // Upsert results to database
    for (const result of results) {
      const { error } = await supabase
        .from('model_health')
        .upsert({
          model_id: result.modelId,
          is_available: result.isAvailable,
          last_checked_at: new Date().toISOString(),
          error_message: result.errorMessage || null,
        }, {
          onConflict: 'model_id',
        });

      if (error) {
        console.error(`Error upserting ${result.modelId}:`, error);
      }
    }

    console.log(`Health check complete. Checked ${results.length} models.`);

    return new Response(JSON.stringify({
      success: true,
      checked: results.length,
      available: results.filter(r => r.isAvailable).length,
      unavailable: results.filter(r => !r.isAvailable).length,
      results,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Health check error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

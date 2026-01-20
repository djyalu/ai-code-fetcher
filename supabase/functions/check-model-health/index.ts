// Model Health Check Edge Function
// Checks availability of specified models or all active models from database

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ModelCheckResult {
  modelId: string;
  isAvailable: boolean;
  errorMessage?: string;
  responseTime?: number;
}

// OpenRouter model ID mapping for legacy short IDs
const OPENROUTER_MODEL_MAP: Record<string, string> = {
  'gpt-4o': 'openai/gpt-4o',
  'gpt-4o-mini': 'openai/gpt-4o-mini',
  'claude-3-5-sonnet': 'anthropic/claude-3.5-sonnet',
  'claude-3-5-haiku': 'anthropic/claude-3.5-haiku',
  'gemini-2.0-flash': 'google/gemini-2.0-flash',
  'gemini-1.5-pro': 'google/gemini-pro-1.5',
  'deepseek-chat': 'deepseek/deepseek-chat',
};

async function checkOpenRouterModel(apiKey: string, modelId: string): Promise<ModelCheckResult> {
  const mappedModel = OPENROUTER_MODEL_MAP[modelId] || modelId;
  const startTime = Date.now();
  
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

    const responseTime = Date.now() - startTime;

    if (response.ok) {
      return { modelId, isAvailable: true, responseTime };
    }

    const errorText = await response.text();
    
    // 429 is rate limit - model exists but temporarily unavailable
    if (response.status === 429) {
      return { modelId, isAvailable: true, errorMessage: 'Rate limited but available', responseTime };
    }

    // 404 means model doesn't exist or no providers
    if (response.status === 404) {
      return { modelId, isAvailable: false, errorMessage: errorText, responseTime };
    }

    return { modelId, isAvailable: false, errorMessage: `HTTP ${response.status}: ${errorText}`, responseTime };
  } catch (error) {
    return { 
      modelId, 
      isAvailable: false, 
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      responseTime: Date.now() - startTime
    };
  }
}

async function checkPerplexityModel(apiKey: string, modelId: string): Promise<ModelCheckResult> {
  const startTime = Date.now();
  // Extract the model name if it has perplexity/ prefix
  const cleanModelId = modelId.startsWith('perplexity/') ? modelId.replace('perplexity/', '') : modelId;
  
  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: cleanModelId,
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 5,
      }),
    });

    const responseTime = Date.now() - startTime;

    if (response.ok) {
      return { modelId: `perplexity/${cleanModelId}`, isAvailable: true, responseTime };
    }

    const errorText = await response.text();
    
    if (response.status === 429) {
      return { modelId: `perplexity/${cleanModelId}`, isAvailable: true, errorMessage: 'Rate limited but available', responseTime };
    }

    return { 
      modelId: `perplexity/${cleanModelId}`, 
      isAvailable: false, 
      errorMessage: `HTTP ${response.status}: ${errorText}`,
      responseTime
    };
  } catch (error) {
    return { 
      modelId: `perplexity/${cleanModelId}`, 
      isAvailable: false, 
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      responseTime: Date.now() - startTime
    };
  }
}

function isPerplexityModel(modelId: string): boolean {
  return modelId.startsWith('sonar') || modelId.startsWith('perplexity/');
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

    // Parse request body for specific model IDs
    let modelIds: string[] = [];
    try {
      const body = await req.json();
      if (body.model_ids && Array.isArray(body.model_ids)) {
        modelIds = body.model_ids;
      } else if (body.model_id) {
        modelIds = [body.model_id];
      }
    } catch {
      // No body or invalid JSON - will fetch from database
    }

    // If no specific models requested, fetch all active models from database
    if (modelIds.length === 0) {
      const { data: dbModels, error: dbError } = await supabase
        .from('ai_models')
        .select('id, model_id')
        .eq('is_active', true);

      if (dbError) {
        console.error('Error fetching models from database:', dbError);
      } else if (dbModels && dbModels.length > 0) {
        modelIds = dbModels.map((m: any) => m.model_id || m.id);
      }
    }

    if (modelIds.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No models to check',
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Starting health check for ${modelIds.length} models...`);

    const results: ModelCheckResult[] = [];

    // Group models by provider
    const perplexityModels = modelIds.filter(isPerplexityModel);
    const openRouterModels = modelIds.filter(id => !isPerplexityModel(id));

    // Check OpenRouter models
    if (openRouterKey && openRouterModels.length > 0) {
      for (const modelId of openRouterModels) {
        const result = await checkOpenRouterModel(openRouterKey, modelId);
        results.push(result);
        console.log(`${modelId}: ${result.isAvailable ? '✓' : '✗'} (${result.responseTime}ms) ${result.errorMessage || ''}`);
        // Small delay between checks to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    } else if (openRouterModels.length > 0) {
      console.warn('OPENROUTER_API_KEY not set, skipping OpenRouter models');
      for (const modelId of openRouterModels) {
        results.push({ modelId, isAvailable: false, errorMessage: 'API key not configured' });
      }
    }

    // Check Perplexity models
    if (perplexityKey && perplexityModels.length > 0) {
      for (const modelId of perplexityModels) {
        const result = await checkPerplexityModel(perplexityKey, modelId);
        results.push(result);
        console.log(`${result.modelId}: ${result.isAvailable ? '✓' : '✗'} (${result.responseTime}ms) ${result.errorMessage || ''}`);
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    } else if (perplexityModels.length > 0) {
      console.warn('PERPLEXITY_API_KEY not set, skipping Perplexity models');
      for (const modelId of perplexityModels) {
        const cleanId = modelId.startsWith('perplexity/') ? modelId : `perplexity/${modelId}`;
        results.push({ modelId: cleanId, isAvailable: false, errorMessage: 'API key not configured' });
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

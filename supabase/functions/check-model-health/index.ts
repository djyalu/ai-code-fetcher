// Model Health Check Edge Function
// Checks availability of models using OpenRouter /api/v1/models (FREE) or ping test

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
  metadata?: {
    inputPrice?: number;
    outputPrice?: number;
    contextWindow?: number;
  };
}

interface OpenRouterModel {
  id: string;
  name: string;
  pricing: {
    prompt: string;
    completion: string;
  };
  context_length: number;
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

// Reverse mapping for finding DB model ID from OpenRouter ID
const REVERSE_MODEL_MAP: Record<string, string> = Object.entries(OPENROUTER_MODEL_MAP)
  .reduce((acc, [key, value]) => ({ ...acc, [value]: key }), {});

// Fetch OpenRouter model list (FREE - no API credits consumed)
async function fetchOpenRouterModelList(apiKey: string): Promise<OpenRouterModel[]> {
  const response = await fetch('https://openrouter.ai/api/v1/models', {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch models: ${response.status}`);
  }
  
  const data = await response.json();
  return data.data || [];
}

// Check model availability from the fetched list (FREE)
function checkModelInList(modelId: string, modelList: OpenRouterModel[]): ModelCheckResult {
  const mappedModel = OPENROUTER_MODEL_MAP[modelId] || modelId;
  const found = modelList.find(m => m.id === mappedModel);
  
  if (found) {
    // Convert pricing from per-token to per-million-tokens
    const inputPrice = parseFloat(found.pricing.prompt) * 1_000_000;
    const outputPrice = parseFloat(found.pricing.completion) * 1_000_000;
    
    return {
      modelId,
      isAvailable: true,
      metadata: {
        inputPrice: isNaN(inputPrice) ? undefined : inputPrice,
        outputPrice: isNaN(outputPrice) ? undefined : outputPrice,
        contextWindow: found.context_length,
      }
    };
  }
  
  return {
    modelId,
    isAvailable: false,
    errorMessage: 'Model not found in OpenRouter catalog'
  };
}

// Ping test for OpenRouter models (consumes API credits)
async function pingOpenRouterModel(apiKey: string, modelId: string): Promise<ModelCheckResult> {
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
    
    if (response.status === 429) {
      return { modelId, isAvailable: true, errorMessage: 'Rate limited but available', responseTime };
    }

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

// Known Perplexity models (hardcoded since no list API available)
const PERPLEXITY_MODELS = [
  'sonar', 'sonar-pro', 'sonar-reasoning', 'sonar-reasoning-pro',
  'sonar-deep-research', 'r1-1776'
];

function isPerplexityModel(modelId: string): boolean {
  return modelId.startsWith('sonar') || modelId.startsWith('perplexity/');
}

function checkPerplexityModelInList(modelId: string): ModelCheckResult {
  const cleanId = modelId.startsWith('perplexity/') ? modelId.replace('perplexity/', '') : modelId;
  const isKnown = PERPLEXITY_MODELS.includes(cleanId);
  
  return {
    modelId: modelId.startsWith('perplexity/') ? modelId : `perplexity/${modelId}`,
    isAvailable: isKnown,
    errorMessage: isKnown ? undefined : 'Unknown Perplexity model'
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    let modelIds: string[] = [];
    let mode: 'free' | 'ping' = 'free'; // Default to free mode
    let autoToggle = false;
    let syncMetadata = false;
    
    try {
      const body = await req.json();
      if (body.model_ids && Array.isArray(body.model_ids)) {
        modelIds = body.model_ids;
      } else if (body.model_id) {
        modelIds = [body.model_id];
      }
      if (body.mode === 'ping') {
        mode = 'ping';
      }
      if (body.auto_toggle === true) {
        autoToggle = true;
      }
      if (body.sync_metadata === true) {
        syncMetadata = true;
      }
    } catch {
      // No body or invalid JSON - will fetch from database
    }

    // If no specific models requested, fetch all models from database (including inactive for sync)
    if (modelIds.length === 0) {
      const { data: dbModels, error: dbError } = await supabase
        .from('ai_models')
        .select('id, model_id');

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

    console.log(`Starting ${mode} health check for ${modelIds.length} models... (autoToggle: ${autoToggle}, syncMetadata: ${syncMetadata})`);

    const results: ModelCheckResult[] = [];
    let openRouterModelList: OpenRouterModel[] = [];

    // Group models by provider
    const perplexityModels = modelIds.filter(isPerplexityModel);
    const openRouterModels = modelIds.filter(id => !isPerplexityModel(id));

    // FREE mode: Fetch OpenRouter model list once
    if (mode === 'free' && openRouterKey && openRouterModels.length > 0) {
      try {
        openRouterModelList = await fetchOpenRouterModelList(openRouterKey);
        console.log(`Fetched ${openRouterModelList.length} models from OpenRouter catalog`);
        
        for (const modelId of openRouterModels) {
          const result = checkModelInList(modelId, openRouterModelList);
          results.push(result);
          console.log(`${modelId}: ${result.isAvailable ? '✓' : '✗'} ${result.errorMessage || ''}`);
        }
      } catch (error) {
        console.error('Error fetching OpenRouter model list:', error);
        for (const modelId of openRouterModels) {
          results.push({ modelId, isAvailable: false, errorMessage: 'Failed to fetch model list' });
        }
      }
    }
    // PING mode: Use chat completions API (consumes credits)
    else if (mode === 'ping' && openRouterKey && openRouterModels.length > 0) {
      for (const modelId of openRouterModels) {
        const result = await pingOpenRouterModel(openRouterKey, modelId);
        results.push(result);
        console.log(`${modelId}: ${result.isAvailable ? '✓' : '✗'} (${result.responseTime}ms) ${result.errorMessage || ''}`);
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    } else if (openRouterModels.length > 0) {
      console.warn('OPENROUTER_API_KEY not set, skipping OpenRouter models');
      for (const modelId of openRouterModels) {
        results.push({ modelId, isAvailable: false, errorMessage: 'API key not configured' });
      }
    }

    // Check Perplexity models (using hardcoded list in free mode)
    for (const modelId of perplexityModels) {
      const result = checkPerplexityModelInList(modelId);
      results.push(result);
      console.log(`${result.modelId}: ${result.isAvailable ? '✓' : '✗'} ${result.errorMessage || ''}`);
    }

    // Upsert health results to database
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
        console.error(`Error upserting health for ${result.modelId}:`, error);
      }
    }

    // Auto-toggle and sync metadata if requested
    let toggled = { activated: 0, deactivated: 0 };
    let synced = 0;

    if (autoToggle || syncMetadata) {
      for (const result of results) {
        const updateData: Record<string, any> = {};
        
        if (autoToggle) {
          updateData.is_active = result.isAvailable;
        }
        
        if (syncMetadata && result.metadata) {
          if (result.metadata.inputPrice !== undefined) {
            updateData.input_price = result.metadata.inputPrice;
          }
          if (result.metadata.outputPrice !== undefined) {
            updateData.output_price = result.metadata.outputPrice;
          }
          if (result.metadata.contextWindow !== undefined) {
            updateData.context_window = result.metadata.contextWindow;
          }
        }
        
        if (Object.keys(updateData).length > 0) {
          const { error } = await supabase
            .from('ai_models')
            .update(updateData)
            .or(`model_id.eq.${result.modelId},id.eq.${result.modelId}`);
          
          if (error) {
            console.error(`Error updating ${result.modelId}:`, error);
          } else {
            if (autoToggle) {
              if (result.isAvailable) toggled.activated++;
              else toggled.deactivated++;
            }
            if (syncMetadata && result.metadata) synced++;
          }
        }
      }
    }

    console.log(`Health check complete. Checked ${results.length} models.`);
    if (autoToggle) {
      console.log(`Auto-toggle: ${toggled.activated} activated, ${toggled.deactivated} deactivated`);
    }
    if (syncMetadata) {
      console.log(`Metadata synced: ${synced} models`);
    }

    return new Response(JSON.stringify({
      success: true,
      mode,
      checked: results.length,
      available: results.filter(r => r.isAvailable).length,
      unavailable: results.filter(r => !r.isAvailable).length,
      toggled: autoToggle ? toggled : undefined,
      synced: syncMetadata ? synced : undefined,
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

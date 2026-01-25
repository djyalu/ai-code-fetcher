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
  // Premium - Frontier
  'gpt-5.2': 'openai/gpt-5.2',
  'gpt-5.2-codex': 'openai/gpt-5.2-codex',
  'claude-3-5-sonnet': 'anthropic/claude-3.5-sonnet',
  'gemini-3-flash-preview': 'google/gemini-3-flash-preview',
  'llama-4-maverick': 'meta-llama/llama-4-maverick',

  // Premium - High Efficiency
  'gpt-4o-mini': 'openai/gpt-4o-mini',
  'deepseek-chat': 'deepseek/deepseek-chat',
  'gemini-2.5-flash-lite': 'google/gemini-2.5-flash-lite-preview',
  'claude-3-5-haiku': 'anthropic/claude-3.5-haiku',

  // Free models (full OpenRouter catalog)
  'google/gemini-2.0-flash-exp:free': 'google/gemini-2.0-flash-exp:free',
  'google/gemma-3-27b-it:free': 'google/gemma-3-27b-it:free',
  'meta-llama/llama-3.3-70b-instruct:free': 'meta-llama/llama-3.3-70b-instruct:free',
  'meta-llama/llama-3.1-405b-instruct:free': 'meta-llama/llama-3.1-405b-instruct:free',
  'deepseek/deepseek-r1-0528:free': 'deepseek/deepseek-r1-0528:free',
  'xiaomi/mimo-v2-flash:free': 'xiaomi/mimo-v2-flash:free',
  'qwen/qwen3-coder:free': 'qwen/qwen3-coder:free',
  'mistralai/devstral-2512:free': 'mistralai/devstral-2512:free',
  'openai/gpt-oss-120b:free': 'openai/gpt-oss-120b:free',
  'nvidia/nemotron-3-nano-30b-a3b:free': 'nvidia/nemotron-3-nano-30b-a3b:free',
  'nousresearch/hermes-3-llama-3.1-405b:free': 'nousresearch/hermes-3-llama-3.1-405b:free',
  'liquid/lfm-2.5-1.2b-instruct:free': 'liquid/lfm-2.5-1.2b-instruct:free',

  // Paid models (with OpenRouter prefix)
  'openai/gpt-4o-mini': 'openai/gpt-4o-mini',
  'google/gemini-2.0-flash-001': 'google/gemini-2.0-flash-001',
  'google/gemini-2.5-flash-lite': 'google/gemini-2.5-flash-lite-preview-06-05',
  'deepseek/deepseek-chat-v3-0324': 'deepseek/deepseek-chat-v3-0324',
  'x-ai/grok-4-fast': 'x-ai/grok-4-fast',
  'x-ai/grok-code-fast-1': 'x-ai/grok-code-fast-1',
  'gpt-4o': 'openai/gpt-4o',
};

function sanitizeMessagesForModel(model: string, messages: ChatMessage[]): ChatMessage[] {
  // Some upstream providers (notably Google AI Studio for Gemma IT) reject "developer/system" instructions.
  // When we detect those models, we remove system messages and fold them into the first user message.
  if (model.includes('google/gemma-3-27b-it')) {
    // Gemma (IT) rejects system/developer instructions. Fold system messages into
    // the first user message when possible. If there's no user message, prepend a
    // new user message containing the system text.
    const systemText = messages
      .filter((m) => m.role === 'system')
      .map((m) => m.content)
      .join('\n');

    const nonSystem = messages.filter((m) => m.role !== 'system').map(m => ({ ...m }));

    if (!systemText) return nonSystem;

    // Prefer folding into the first actual user message (preserves existing order)
    const firstUserIndex = nonSystem.findIndex((m) => m.role === 'user');
    if (firstUserIndex >= 0) {
      nonSystem[firstUserIndex].content = `${systemText}\n\n${nonSystem[firstUserIndex].content}`;
      return nonSystem;
    }

    // No user message exists; create one at the front containing the system text
    return [{ role: 'user', content: systemText }, ...nonSystem];
  }

  return messages;
}

async function callPerplexity(
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  stream: boolean,
  timeoutMs = 15000
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model, messages, stream }),
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(id);
  }
}

async function callOpenRouter(
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  stream: boolean,
  timeoutMs = 15000
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://lovable.dev',
        'X-Title': 'Multi AI Chat',
      },
      body: JSON.stringify({ model, messages, stream }),
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(id);
  }
}

function jsonErrorResponse(message: string, status = 500, code?: string, detail?: any) {
  const body: any = { message };
  if (code) body.error_code = code;
  if (detail) body.detail = detail;
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Helper to detect Perplexity models
function isPerplexityModel(model: string): boolean {
  // Only treat explicit sonar variants as Perplexity models. Do not treat arbitrary
  // `perplexity/*` IDs as Perplexity models to avoid unintended fallbacks.
  return (
    model === 'perplexity/sonar' ||
    model === 'perplexity/sonar-deep-research' ||
    model === 'sonar' ||
    model === 'sonar-deep-research'
  );
}

// PAID models are stored in the database (public.model_metadata)
// We'll keep a short-lived in-memory cache to avoid a DB hit on every request.
const PAID_MODELS_CACHE_TTL_MS = 60 * 1000; // 1 minute
let paidModelsCache: Set<string> = new Set();
let paidModelsCacheFetchedAt = 0;
const MODEL_HEALTH_COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes cooldown when a model is marked unavailable

async function refreshPaidModelsCache(supabaseAdmin: any) {
  try {
    const { data, error } = await supabaseAdmin.from('model_metadata').select('model_id').eq('is_paid', true);
    if (!error && Array.isArray(data)) {
      paidModelsCache = new Set(data.map((r: any) => r.model_id));
      paidModelsCacheFetchedAt = Date.now();
      console.log('Paid models cache refreshed:', Array.from(paidModelsCache));
    } else if (error) {
  console.warn('Failed to refresh paid models cache:', (error as any)?.message || error);
    }
    } catch (e) {
      console.warn('Error refreshing paid models cache:', (e as any)?.message || e);
    }
}

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Map Perplexity model IDs to API model names
function getPerplexityModelName(model: string): string {
  if (model === 'perplexity/sonar' || model === 'sonar') return 'sonar';
  if (model === 'perplexity/sonar-deep-research' || model === 'sonar-deep-research') return 'sonar-deep-research';
  // If it's not one of the supported Perplexity models, return the input unchanged.
  // We intentionally avoid a generic `perplexity/*` fallback to `sonar`.
  return model;
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

    // Create Supabase admin client if possible for health updates and paid-model cache refresh
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    let supabaseAdmin: any = null;
    if (supabaseUrl && supabaseServiceKey) {
      supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
      // Refresh paid models cache if stale
      if (Date.now() - paidModelsCacheFetchedAt > PAID_MODELS_CACHE_TTL_MS) {
        await refreshPaidModelsCache(supabaseAdmin);
      }

      // Check model_health for this model and honor cooldown if it's marked unavailable
      try {
        const { data: mh, error: mhError } = await supabaseAdmin
          .from('model_health')
          .select('is_available, last_checked_at')
          .eq('model_id', mappedModel)
          .maybeSingle();

        if (!mhError && mh && mh.is_available === false) {
          const lastChecked = new Date(mh.last_checked_at).getTime();
          if (Date.now() - lastChecked < MODEL_HEALTH_COOLDOWN_MS) {
            console.warn(`Model ${mappedModel} is in cooldown (last failed at ${mh.last_checked_at})`);
            return jsonErrorResponse(`Model ${mappedModel} temporarily unavailable`, 503, 'model_unavailable');
          }
        }
      } catch (e) {
    console.warn('Failed to read model_health (non-fatal):', (e as any)?.message || e);
      }
    }

    // If this is a paid model (based on our PAID_MODELS set), require authentication
    if (paidModelsCache.has(model) || paidModelsCache.has(mappedModel)) {
      const authHeader = req.headers.get('authorization') || req.headers.get('Authorization') || '';
      if (!authHeader.startsWith('Bearer ')) {
        console.warn('Paid model access denied: missing bearer token');
        return jsonErrorResponse('Paid models require an authenticated user', 401, 'auth_required');
      }

      const token = authHeader.slice(7);
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      if (!supabaseUrl || !supabaseServiceKey) {
        console.error('Supabase service role key not configured');
        return jsonErrorResponse('Server misconfiguration: SUPABASE_SERVICE_ROLE_KEY missing', 500, 'server_misconfig');
      }

      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
      const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
      const userId = userData?.user?.id;
      const userEmail = userData?.user?.email || null;

      if (userError || !userId) {
        console.warn('Paid model access denied: invalid token', userError?.message);
        return jsonErrorResponse('Paid models require an authenticated user', 401, 'auth_required');
      }

      // Attach user info to the request context via a small object we can use later for logging
      (req as any).__user = { id: userId, email: userEmail };
    }

    // Route Perplexity models directly to Perplexity API
    if (isPerplexityModel(mappedModel)) {
      // Enforce admin-only access for Perplexity models.
      const authHeader = req.headers.get('authorization') || req.headers.get('Authorization') || '';
      const adminEmail = 'go41@naver.com';

      if (!authHeader.startsWith('Bearer ')) {
        console.error('Perplexity access denied: missing bearer token');
        return jsonErrorResponse('Perplexity models are restricted to admin users', 403, 'forbidden');
      }

      const token = authHeader.slice(7);

      // Verify the token server-side using Supabase service role key to prevent spoofing.
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      if (!supabaseUrl || !supabaseServiceKey) {
        console.error('Supabase service role key not configured');
        return jsonErrorResponse('Server misconfiguration: SUPABASE_SERVICE_ROLE_KEY missing', 500, 'server_misconfig');
      }

      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
      const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
      const userId = userData?.user?.id;

      if (userError || !userId) {
        console.error('Perplexity access denied: invalid token', userError?.message);
        return jsonErrorResponse('Perplexity models are restricted to admin users', 403, 'forbidden');
      }

      // Check user's role in the profiles table. Only role === 'admin' is allowed.
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (profileError || !profile || profile.role !== 'admin') {
        console.error('Perplexity access denied - not an admin', profileError?.message);
        return jsonErrorResponse('Perplexity models are restricted to admin users', 403, 'forbidden');
      }

      const perplexityKey = Deno.env.get('PERPLEXITY_API_KEY');
      if (!perplexityKey) {
        console.error('PERPLEXITY_API_KEY not configured');
        return jsonErrorResponse('Perplexity API key not configured', 500, 'server_misconfig');
      }

      const perplexityModelName = getPerplexityModelName(mappedModel);
      console.log(`Routing to Perplexity API with model: ${perplexityModelName}`);

      const response = await callPerplexity(perplexityKey, perplexityModelName, messages, stream);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Perplexity API error: ${response.status} - ${errorText}`);
        // Best-effort: mark model health based on failure
        try {
          if (supabaseAdmin) {
            const isAvailable = response.status === 429 ? true : false;
            await supabaseAdmin.from('model_health').upsert({
              model_id: `perplexity/${perplexityModelName}`,
              is_available: isAvailable,
              last_checked_at: new Date().toISOString(),
              error_message: `Perplexity ${response.status}: ${errorText}`,
            }, { onConflict: 'model_id' });
          }
        } catch (e) {
          console.warn('Failed to upsert model_health for Perplexity (non-fatal):', (e as any)?.message || e);
        }

  return jsonErrorResponse(`Perplexity API error: ${response.status}`, response.status, 'upstream_error');
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
      // Try to log prompt/result to prompt_logs (best-effort)
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        if (supabaseUrl && supabaseServiceKey) {
          const admin = createClient(supabaseUrl, supabaseServiceKey);
          const userEmail = (req as any).__user?.email || userData?.user?.email || null;
          const promptText = messages.filter(m => m.role === 'user').map(m => m.content).join('\n');
          await admin.from('prompt_logs').insert({
            prompt: promptText,
            result: data.choices?.[0]?.message?.content || '',
            model_id: `perplexity/${perplexityModelName}`,
            owner_email: userEmail,
          } as any);
        }
      } catch (e) {
        console.warn('Prompt logging failed for Perplexity (non-fatal):', (e as any)?.message || e);
      }

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
      return jsonErrorResponse('OpenRouter API key not configured', 500, 'server_misconfig');
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
      details?: Record<string, unknown>;
      constructor(message: string, status: number, details?: Record<string, unknown>) {
        super(message);
        this.status = status;
        this.details = details;
      }
    }

    const safeJsonParse = (text: string): any | null => {
      try {
        return JSON.parse(text);
      } catch {
        return null;
      }
    };

    const extractProviderMessage = (errorText: string): string => {
      const parsed = safeJsonParse(errorText);
      // Common OpenRouter shapes
      const msg =
        parsed?.error?.message ||
        parsed?.error?.metadata?.raw ||
        parsed?.message ||
        parsed?.error ||
        '';
      return typeof msg === 'string' ? msg : errorText;
    };

    const buildUserFacingError = (status: number, modelId: string, errorText: string, resetHeader?: string | null) => {
      const providerMsg = extractProviderMessage(errorText);

      if (status === 429) {
        return {
          message: resetHeader
            ? `요청이 너무 많아 잠시 제한되었습니다. 잠시 후 다시 시도해 주세요. (reset: ${resetHeader})`
            : '요청이 너무 많아 잠시 제한되었습니다. 10~60초 후 다시 시도해 주세요.',
          details: { model: modelId, status, providerMessage: providerMsg },
        };
      }

      if (status === 404) {
        if (providerMsg.includes('No endpoints found')) {
          return {
            message: `선택한 모델(${modelId})을 현재 사용할 수 없습니다. (제공 엔드포인트 없음) 다른 모델로 변경해 주세요.`,
            details: { model: modelId, status, providerMessage: providerMsg },
          };
        }
        if (providerMsg.includes('No allowed providers')) {
          return {
            message: `선택한 모델(${modelId})에 대해 사용 가능한 제공자가 없습니다. 다른 모델로 변경해 주세요.`,
            details: { model: modelId, status, providerMessage: providerMsg },
          };
        }
        return {
          message: `선택한 모델(${modelId}) 호출에 실패했습니다. (404) 다른 모델로 변경해 주세요.`,
          details: { model: modelId, status, providerMessage: providerMsg },
        };
      }

      if (status >= 500) {
        return {
          message: `모델 제공자 쪽 일시 오류로 실패했습니다. (${status}) 잠시 후 다시 시도해 주세요.`,
          details: { model: modelId, status, providerMessage: providerMsg },
        };
      }

      return {
        message: `요청 처리 중 오류가 발생했습니다. (${status})`,
        details: { model: modelId, status, providerMessage: providerMsg },
      };
    };

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
         // Best-effort: mark rate-limit in model_health but don't mark unavailable
         try {
           if (supabaseAdmin) {
             await supabaseAdmin.from('model_health').upsert({
               model_id: mappedModel,
               is_available: true,
               last_checked_at: new Date().toISOString(),
               error_message: `Rate limited: ${errorText || '429'}`,
             }, { onConflict: 'model_id' });
           }
         } catch (e) {
           console.warn('Failed to upsert model_health for rate limit (non-fatal):', (e as any)?.message || e);
         }

         const friendly = buildUserFacingError(429, mappedModel, errorText, resetHeader);
         lastError = new HttpError(friendly.message, 429, friendly.details);
         break;
       }

       if (!response.ok) {
         const errorText = await response.text();
         console.error(`OpenRouter API error: ${response.status} - ${errorText}`);

         // If it's a 404 or server error, mark the model unavailable for cooldown window
         try {
           if (supabaseAdmin) {
             const markUnavailable = response.status === 404 || response.status >= 500;
             await supabaseAdmin.from('model_health').upsert({
               model_id: mappedModel,
               is_available: markUnavailable ? false : true,
               last_checked_at: new Date().toISOString(),
               error_message: `OpenRouter ${response.status}: ${errorText}`,
             }, { onConflict: 'model_id' });
           }
         } catch (e) {
           console.warn('Failed to upsert model_health (non-fatal):', (e as any)?.message || e);
         }

         const friendly = buildUserFacingError(response.status, mappedModel, errorText);

         // Retry transient errors, but preserve the upstream status code
         lastError = new HttpError(friendly.message, response.status, friendly.details);
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
      // Best-effort: log prompt and result to prompt_logs
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        if (supabaseUrl && supabaseServiceKey) {
          const admin = createClient(supabaseUrl, supabaseServiceKey);
          const userEmail = (req as any).__user?.email || null;
          const promptText = messages.filter(m => m.role === 'user').map(m => m.content).join('\n');
          await admin.from('prompt_logs').insert({
            prompt: promptText,
            result: data.choices?.[0]?.message?.content || '',
            model_id: mappedModel,
            owner_email: userEmail,
          } as any);
        }
      } catch (e) {
        console.warn('Prompt logging failed (non-fatal):', (e as any)?.message || e);
      }

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
    const details = (error as any)?.details && typeof (error as any).details === 'object'
      ? (error as any).details
      : undefined;

    // Log and return the standardized JSON error response so clients get a stable schema
    console.error('Error in chat function:', errorMessage, details ? JSON.stringify(details) : '');
    return jsonErrorResponse(errorMessage, status, (error as any)?.code || undefined, (error as any)?.detail || undefined);
  }
});

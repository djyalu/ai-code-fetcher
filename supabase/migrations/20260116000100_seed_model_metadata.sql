-- Seed model_metadata with recommended paid/free models
BEGIN;

INSERT INTO public.model_metadata (model_id, is_paid, input_price, updated_at) VALUES
  ('gpt-4o', true, 2.5, timezone('utc', now())),
  ('gpt-4o-mini', true, 0.15, timezone('utc', now())),
  ('claude-3-5-sonnet', true, 3, timezone('utc', now())),
  ('claude-3-5-haiku', true, 0.25, timezone('utc', now())),
  ('gemini-2.0-flash', true, 0.1, timezone('utc', now())),
  ('gemini-1.5-pro', true, 1.25, timezone('utc', now())),
  ('deepseek-chat', true, 0.14, timezone('utc', now())),
  ('perplexity/sonar', true, 1, timezone('utc', now())),
  ('perplexity/sonar-deep-research', true, 2, timezone('utc', now())),
  ('google/gemini-2.0-flash-exp:free', false, 0, timezone('utc', now()));

-- If the row already exists, update to ensure values are in sync
ON CONFLICT (model_id) DO UPDATE
  SET is_paid = EXCLUDED.is_paid,
      input_price = EXCLUDED.input_price,
      updated_at = timezone('utc', now());

COMMIT;

-- NOTE: Review these prices and model ids before applying in production. Run this in Supabase SQL editor or via migration tooling.

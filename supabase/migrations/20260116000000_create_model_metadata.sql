-- Create model_metadata table to mark which models are paid
create table if not exists public.model_metadata (
  model_id text primary key,
  is_paid boolean not null default false,
  input_price numeric,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Note: Populate this table via admin UI or an upsert migration. Example:
-- insert into public.model_metadata (model_id, is_paid, input_price) values ('gpt-4o', true, 2.5);

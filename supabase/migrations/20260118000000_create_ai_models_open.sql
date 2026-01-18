
create table if not exists public.ai_models (
  id text primary key,
  name text not null,
  provider text not null,
  description text,
  input_price numeric default 0,
  output_price numeric default 0,
  context_window integer default 4096,
  color text default '#888888',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.ai_models enable row level security;

-- Create policies
create policy "Allow read access to all users"
  on public.ai_models for select
  using (true);

create policy "Allow all access to all users"
  on public.ai_models for all
  using (true);

-- Function to update updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger handle_ai_models_updated_at
  before update on public.ai_models
  for each row
  execute function public.handle_updated_at();

-- Create prompt_logs table
create table if not exists public.prompt_logs (
  id uuid default gen_random_uuid() primary key,
  prompt text not null,
  result text,
  model_id text,
  owner_email text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.prompt_logs enable row level security;

-- Policies
create policy "Admins can view all logs" on public.prompt_logs
  for select using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

create policy "Authenticated users can insert logs" on public.prompt_logs
  for insert with check (auth.role() = 'authenticated' or auth.role() = 'anon');

-- Allow owner to see their own logs if needed
create policy "Users can view their own logs" on public.prompt_logs
  for select using (
    owner_email = (select email from auth.users where id = auth.uid())
  );

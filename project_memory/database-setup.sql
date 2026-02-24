-- Supabase Schema and RLS Setup for ClutterCut

create table organization_runs (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users not null,
    folder_path text not null,
    ran_at timestamptz not null default now(),
    synced_at timestamptz,
    rules jsonb not null,
    before_snapshot jsonb not null,
    after_snapshot jsonb not null,
    files_affected integer not null,
    is_undo boolean not null default false,
    undone boolean not null default false,
    parent_run_id uuid references organization_runs(id)
);

alter table organization_runs enable row level security;

create policy "Users can see their own runs" on organization_runs
    for select using (auth.uid() = user_id);

create policy "Users can insert their own runs" on organization_runs
    for insert with check (auth.uid() = user_id);

create policy "Users can update their own runs" on organization_runs
    for update using (auth.uid() = user_id);

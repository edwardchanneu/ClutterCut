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

-- E2E Testing Helper: Allows a test user to delete themselves without needing the Service Role Key.
-- This function contains strict safeguards so it can ONLY delete users whose email starts with 'test_e2e_'.
create or replace function delete_test_user()
returns void as $$
declare
    _user_email text;
begin
    -- 1. Get the email of the currently authenticated user
    select email into _user_email from auth.users where id = auth.uid();
    
    -- 2. Strictly verify the email format to prevent deleting real users
    if _user_email like 'test_e2e_%@example.com' then
        delete from auth.users where id = auth.uid();
    else
        raise exception 'Unauthorized: Only automated test users can self-delete.';
    end if;
end;
$$ language plpgsql security definer set search_path = public;

-- Function to drop all RLS policies on all relations in the public schema
-- and enable RLS with access for authenticated users only.

create or replace function public.reset_all_rls_to_authenticated()
returns void
language plpgsql
security definer
as $$
declare
    r record;
    policy_record record;
begin
    -- 1. Loop through all tables in the public schema
    for r in (
        select tablename 
        from pg_tables 
        where schemaname = 'public'
    ) loop
        -- 2. Drop all existing policies for each table
        for policy_record in (
            select policyname
            from pg_policies
            where schemaname = 'public' 
              and tablename = r.tablename
        ) loop
            execute format('drop policy if exists %I on public.%I', policy_record.policyname, r.tablename);
        end loop;

        -- 3. Ensure RLS is enabled on the table
        execute format('alter table public.%I enable row level security', r.tablename);

        -- 4. Create a single policy for authenticated users (full access)
        execute format(
            'create policy "authenticated_full_access" on public.%I for all to authenticated using (true) with check (true)',
            r.tablename
        );
        
        raise notice 'Reset RLS for table: %', r.tablename;
    end loop;
end;
$$;

-- Usage:
-- select public.reset_all_rls_to_authenticated();

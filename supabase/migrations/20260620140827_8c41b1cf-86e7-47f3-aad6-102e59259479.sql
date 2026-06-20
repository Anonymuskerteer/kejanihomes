
-- handle_new_user runs only from trigger
revoke execute on function public.handle_new_user() from public, anon, authenticated;
-- set_updated_at runs only from trigger
revoke execute on function public.set_updated_at() from public, anon, authenticated;
-- has_role / get_user_role: only signed-in users can call directly via RPC
revoke execute on function public.has_role(uuid, public.app_role) from public, anon;
grant execute on function public.has_role(uuid, public.app_role) to authenticated;
revoke execute on function public.get_user_role(uuid) from public, anon;
grant execute on function public.get_user_role(uuid) to authenticated;

-- Recreate set_updated_at with explicit search_path
create or replace function public.set_updated_at() returns trigger
language plpgsql security definer set search_path = public
as $$ begin new.updated_at = now(); return new; end; $$;
revoke execute on function public.set_updated_at() from public, anon, authenticated;

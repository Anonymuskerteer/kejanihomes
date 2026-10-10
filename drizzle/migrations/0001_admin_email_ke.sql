CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
declare v_role app_role;
begin
  insert into public.profiles (id, full_name, email, phone)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), new.email, coalesce(new.raw_user_meta_data->>'phone', ''));
  if new.email in ('admin@kejanihomes.ke', 'admin@kejanihomes.com') then
    v_role := 'admin';
  elsif coalesce(new.raw_user_meta_data->>'role','') = 'landlord' then
    v_role := 'landlord';
  else
    v_role := 'tenant';
  end if;
  insert into public.user_roles (user_id, role) values (new.id, v_role);
  return new;
end;
$function$;
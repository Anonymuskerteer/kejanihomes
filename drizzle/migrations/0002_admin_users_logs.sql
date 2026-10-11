ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS account_status text NOT NULL DEFAULT 'active';

CREATE OR REPLACE FUNCTION public.protect_account_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
begin
  if new.account_status is distinct from old.account_status
     and coalesce(auth.role(), '') <> 'service_role'
     and not public.has_role(auth.uid(), 'admin') then
    new.account_status := old.account_status;
  end if;
  return new;
end; $$;
CREATE TRIGGER protect_account_status BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_account_status();

CREATE TABLE public.user_bans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text,
  phone text,
  reason text,
  banned_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.user_bans TO authenticated;
GRANT ALL ON public.user_bans TO service_role;
ALTER TABLE public.user_bans ENABLE ROW LEVEL SECURITY;
CREATE POLICY bans_admin_all ON public.user_bans FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  category text NOT NULL DEFAULT 'activity',
  action text NOT NULL,
  target_type text,
  target_id text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX activity_logs_created_idx ON public.activity_logs(created_at DESC);
GRANT SELECT, INSERT ON public.activity_logs TO authenticated;
GRANT ALL ON public.activity_logs TO service_role;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY logs_admin_read ON public.activity_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY logs_insert_own ON public.activity_logs FOR INSERT TO authenticated
  WITH CHECK (actor_id = auth.uid() AND category = 'system' AND action IN ('sign_in','sign_out','session_expired','password_changed'));

CREATE POLICY saved_select_admin ON public.saved_properties FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.log_site_activity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
begin
  if TG_TABLE_NAME = 'properties' then
    if TG_OP = 'INSERT' then
      insert into activity_logs(actor_id, category, action, target_type, target_id, details)
      values (new.owner_id, 'activity', 'listing_created', 'property', new.id::text, jsonb_build_object('title', new.title));
    elsif new.status is distinct from old.status then
      insert into activity_logs(actor_id, category, action, target_type, target_id, details)
      values (auth.uid(), 'activity', 'listing_' || new.status, 'property', new.id::text, jsonb_build_object('title', new.title));
    end if;
  elsif TG_TABLE_NAME = 'reviews' and TG_OP = 'INSERT' then
    insert into activity_logs(actor_id, category, action, target_type, target_id, details)
    values (new.user_id, 'activity', 'review_posted', 'property', new.property_id::text, jsonb_build_object('rating', new.rating));
  elsif TG_TABLE_NAME = 'saved_properties' and TG_OP = 'INSERT' then
    insert into activity_logs(actor_id, category, action, target_type, target_id)
    values (new.user_id, 'activity', 'property_saved', 'property', new.property_id::text);
  elsif TG_TABLE_NAME = 'profiles' and TG_OP = 'INSERT' then
    insert into activity_logs(actor_id, category, action, target_type, target_id, details)
    values (new.id, 'system', 'account_created', 'user', new.id::text, jsonb_build_object('email', new.email));
  end if;
  return new;
end; $$;
CREATE TRIGGER log_properties AFTER INSERT OR UPDATE ON public.properties FOR EACH ROW EXECUTE FUNCTION public.log_site_activity();
CREATE TRIGGER log_reviews AFTER INSERT ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.log_site_activity();
CREATE TRIGGER log_saved AFTER INSERT ON public.saved_properties FOR EACH ROW EXECUTE FUNCTION public.log_site_activity();
CREATE TRIGGER log_profiles AFTER INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.log_site_activity();
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS saves_count integer NOT NULL DEFAULT 0;
UPDATE public.properties p SET saves_count = (SELECT count(*) FROM public.saved_properties s WHERE s.property_id = p.id);

CREATE OR REPLACE FUNCTION public.sync_saves_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
begin
  if TG_OP = 'INSERT' then
    update properties set saves_count = saves_count + 1 where id = new.property_id;
  elsif TG_OP = 'DELETE' then
    update properties set saves_count = greatest(saves_count - 1, 0) where id = old.property_id;
  end if;
  return null;
end; $$;
CREATE TRIGGER sync_saves_count AFTER INSERT OR DELETE ON public.saved_properties
FOR EACH ROW EXECUTE FUNCTION public.sync_saves_count();

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS must_reset_password boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.protect_account_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
begin
  if coalesce(auth.role(), '') <> 'service_role' and not public.has_role(auth.uid(), 'admin') then
    new.account_status := old.account_status;
    new.must_reset_password := old.must_reset_password;
  end if;
  return new;
end; $$;

CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  tenant_id uuid NOT NULL,
  landlord_id uuid NOT NULL,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (property_id, tenant_id)
);
GRANT SELECT, INSERT, UPDATE ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY conv_select ON public.conversations FOR SELECT TO authenticated
  USING (auth.uid() IN (tenant_id, landlord_id) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY conv_insert ON public.conversations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = tenant_id AND tenant_id <> landlord_id
    AND EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id AND p.owner_id = landlord_id));
CREATE POLICY conv_update ON public.conversations FOR UPDATE TO authenticated
  USING (auth.uid() IN (tenant_id, landlord_id));

CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  body text NOT NULL DEFAULT '',
  property_id uuid,
  latitude double precision,
  longitude double precision,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX messages_conv_idx ON public.messages(conversation_id, created_at);
GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.is_conversation_member(_conv uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  select exists(select 1 from conversations where id = _conv and _user in (tenant_id, landlord_id))
$$;
CREATE POLICY msg_select ON public.messages FOR SELECT TO authenticated
  USING (public.is_conversation_member(conversation_id, auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY msg_insert ON public.messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND public.is_conversation_member(conversation_id, auth.uid()));
CREATE POLICY msg_update ON public.messages FOR UPDATE TO authenticated
  USING (public.is_conversation_member(conversation_id, auth.uid()));

CREATE OR REPLACE FUNCTION public.touch_conversation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
begin update conversations set last_message_at = new.created_at where id = new.conversation_id; return new; end; $$;
CREATE TRIGGER touch_conversation AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION public.touch_conversation();

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
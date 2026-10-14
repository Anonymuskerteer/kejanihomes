CREATE OR REPLACE FUNCTION public.protect_property_moderation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
begin
  if coalesce(auth.role(), '') = 'service_role' or public.has_role(auth.uid(), 'admin') then
    return new;
  end if;
  if TG_OP = 'INSERT' then
    if new.status = 'approved' then new.status := 'pending'; end if;
    new.is_featured := false;
    new.rejection_reason := null;
  else
    if new.status = 'approved' and old.status is distinct from 'approved' then new.status := 'pending'; end if;
    new.is_featured := old.is_featured;
    new.rejection_reason := old.rejection_reason;
  end if;
  return new;
end; $$;
CREATE TRIGGER protect_property_moderation BEFORE INSERT OR UPDATE ON public.properties
FOR EACH ROW EXECUTE FUNCTION public.protect_property_moderation();

CREATE OR REPLACE FUNCTION public.protect_review_approval()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
begin
  if coalesce(auth.role(), '') = 'service_role' or public.has_role(auth.uid(), 'admin') then
    return new;
  end if;
  new.is_approved := false;
  return new;
end; $$;
CREATE TRIGGER protect_review_approval BEFORE INSERT OR UPDATE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.protect_review_approval();

DROP POLICY IF EXISTS reviews_select_all ON public.reviews;
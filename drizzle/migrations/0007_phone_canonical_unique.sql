CREATE OR REPLACE FUNCTION public.normalize_ke_phone(p text) RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE WHEN d ~ '^(7\d{8}|1[01]\d{7})$' THEN '+254' || d ELSE NULLIF(p,'') END
  FROM (SELECT regexp_replace(regexp_replace(coalesce(p,''), '[^0-9+]', '', 'g'), '^(\+?254|0)', '') d) s
$$;

UPDATE public.profiles SET phone = public.normalize_ke_phone(phone) WHERE coalesce(phone,'') <> '';

CREATE OR REPLACE FUNCTION public.enforce_unique_phone() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.phone := public.normalize_ke_phone(NEW.phone);
  IF NEW.phone IS NOT NULL AND (TG_OP = 'INSERT' OR NEW.phone IS DISTINCT FROM OLD.phone)
     AND EXISTS (SELECT 1 FROM public.profiles WHERE phone = NEW.phone AND id <> NEW.id) THEN
    RAISE EXCEPTION 'PHONE_TAKEN' USING ERRCODE = '23505';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS profiles_unique_phone ON public.profiles;
CREATE TRIGGER profiles_unique_phone BEFORE INSERT OR UPDATE OF phone ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.enforce_unique_phone();

CREATE INDEX IF NOT EXISTS profiles_phone_idx ON public.profiles (phone);
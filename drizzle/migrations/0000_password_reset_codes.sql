CREATE TABLE public.password_reset_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  code_hash text NOT NULL,
  attempts int NOT NULL DEFAULT 0,
  expires_at timestamptz NOT NULL,
  used boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.password_reset_codes TO service_role;
ALTER TABLE public.password_reset_codes ENABLE ROW LEVEL SECURITY;
CREATE INDEX password_reset_codes_email_idx ON public.password_reset_codes(email, created_at DESC);
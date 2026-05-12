-- PSG invite links for controlled PSG account onboarding
CREATE TABLE IF NOT EXISTS public.psg_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token_hash TEXT NOT NULL UNIQUE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  used_by_email TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_psg_invites_expires_at ON public.psg_invites(expires_at);
CREATE INDEX IF NOT EXISTS idx_psg_invites_used_at ON public.psg_invites(used_at);

ALTER TABLE public.psg_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage PSG invites"
  ON public.psg_invites FOR ALL
  USING (get_user_role(auth.uid()) = 'admin')
  WITH CHECK (get_user_role(auth.uid()) = 'admin');

CREATE OR REPLACE FUNCTION public.consume_psg_invite(
  p_token_hash TEXT,
  p_used_email TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invite_id UUID;
BEGIN
  SELECT id
  INTO invite_id
  FROM public.psg_invites
  WHERE token_hash = p_token_hash
    AND used_at IS NULL
    AND expires_at > NOW()
  LIMIT 1
  FOR UPDATE;

  IF invite_id IS NULL THEN
    RETURN FALSE;
  END IF;

  UPDATE public.psg_invites
  SET used_at = NOW(),
      used_by_email = p_used_email
  WHERE id = invite_id;

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.consume_psg_invite(TEXT, TEXT) TO anon, authenticated;

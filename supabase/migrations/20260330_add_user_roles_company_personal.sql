-- Extend user_role with company and personal (idempotent for re-runs).
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'company';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'personal';

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role text;
BEGIN
  v_role := lower(coalesce(NEW.raw_user_meta_data->>'role', 'collector'));

  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NULLIF(coalesce(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''), ''),
    CASE
      WHEN v_role IN ('requester', 'collector', 'agent', 'admin', 'company', 'personal') THEN v_role::public.user_role
      ELSE 'collector'::public.user_role
    END
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_update_user_role(target_user_id uuid, new_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Access denied: admin only';
  END IF;

  IF new_role NOT IN ('requester', 'collector', 'agent', 'admin', 'company', 'personal') THEN
    RAISE EXCEPTION 'Invalid role: %', new_role;
  END IF;

  UPDATE profiles SET role = new_role::user_role, updated_at = NOW()
  WHERE id = target_user_id;
END;
$$;

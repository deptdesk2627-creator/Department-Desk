ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'approved'
    CHECK (approval_status IN ('pending', 'approved', 'declined')),
  ADD COLUMN IF NOT EXISTS approved_by text,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

UPDATE public.users AS public_user
SET email = auth_user.email
FROM auth.users AS auth_user
WHERE public_user.auth_user_id = auth_user.id
  AND (public_user.email IS NULL OR public_user.email = '');

CREATE OR REPLACE FUNCTION public.create_public_user_for_auth_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  profile_username text;
  profile_role text;
  initial_approval_status text;
  role_limit integer;
  current_role_count integer;
BEGIN
  profile_username := COALESCE(
    NULLIF(BTRIM(NEW.raw_user_meta_data ->> 'full_name'), ''),
    NULLIF(SPLIT_PART(COALESCE(NEW.email, ''), '@', 1), ''),
    'User'
  );
  profile_role := COALESCE(
    NULLIF(BTRIM(NEW.raw_user_meta_data ->> 'role'), ''),
    'staff'
  );

  role_limit := CASE profile_role
    WHEN 'secretary' THEN 3
    WHEN 'dean' THEN 1
    ELSE NULL
  END;

  IF role_limit IS NOT NULL THEN
    PERFORM pg_advisory_xact_lock(
      pg_catalog.hashtext('public.users.signup.' || profile_role)
    );

    SELECT COUNT(*)::integer
    INTO current_role_count
    FROM public.users
    WHERE public.users.role = profile_role;

    IF current_role_count >= role_limit THEN
      RAISE EXCEPTION 'The % role has reached its signup limit.', profile_role
        USING ERRCODE = '23514';
    END IF;
  END IF;

  initial_approval_status := CASE
    WHEN profile_role IN ('secretary', 'dean') THEN 'approved'
    ELSE 'pending'
  END;

  INSERT INTO public.users (username, email, role, approval_status, auth_user_id)
  VALUES (profile_username, NEW.email, profile_role, initial_approval_status, NEW.id)
  ON CONFLICT (auth_user_id) DO UPDATE
    SET username = EXCLUDED.username,
        email = COALESCE(EXCLUDED.email, public.users.email),
        role = EXCLUDED.role;

  RETURN NEW;
END;
$$;

GRANT UPDATE ON public.users TO authenticated;

DROP POLICY IF EXISTS users_update_approval_for_secretary_and_dean
ON public.users;

CREATE POLICY users_update_approval_for_secretary_and_dean
ON public.users
FOR UPDATE
TO authenticated
USING (
  (SELECT auth.jwt() -> 'app_metadata' ->> 'role') IN ('secretary', 'dean')
)
WITH CHECK (
  (SELECT auth.jwt() -> 'app_metadata' ->> 'role') IN ('secretary', 'dean')
);

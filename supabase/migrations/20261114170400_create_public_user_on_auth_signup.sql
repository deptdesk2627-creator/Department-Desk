CREATE OR REPLACE FUNCTION public.create_public_user_for_auth_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  profile_username text;
  profile_role text;
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

  INSERT INTO public.users (username, role, auth_user_id)
  VALUES (profile_username, profile_role, NEW.id)
  ON CONFLICT (auth_user_id) DO UPDATE
    SET username = EXCLUDED.username,
        role = EXCLUDED.role;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.create_public_user_for_auth_signup()
FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created_create_public_user
ON auth.users;

CREATE TRIGGER on_auth_user_created_create_public_user
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.create_public_user_for_auth_signup();

CREATE OR REPLACE FUNCTION public.get_signup_role_availability()
RETURNS TABLE (role text, is_available boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT role_limits.role, role_limits.current_count < role_limits.max_count
  FROM (
    SELECT
      'secretary'::text AS role,
      (SELECT COUNT(*)::integer FROM public.users WHERE public.users.role = 'secretary') AS current_count,
      3 AS max_count
    UNION ALL
    SELECT
      'dean'::text AS role,
      (SELECT COUNT(*)::integer FROM public.users WHERE public.users.role = 'dean') AS current_count,
      1 AS max_count
  ) AS role_limits;
$$;

REVOKE ALL ON FUNCTION public.get_signup_role_availability()
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_signup_role_availability()
TO anon, authenticated;

INSERT INTO public.users (username, role, auth_user_id)
SELECT
  COALESCE(
    NULLIF(BTRIM(auth_user.raw_user_meta_data ->> 'full_name'), ''),
    NULLIF(SPLIT_PART(COALESCE(auth_user.email, ''), '@', 1), ''),
    'User'
  ),
  COALESCE(
    NULLIF(BTRIM(auth_user.raw_user_meta_data ->> 'role'), ''),
    'staff'
  ),
  auth_user.id
FROM auth.users AS auth_user
WHERE NOT EXISTS (
  SELECT 1
  FROM public.users AS public_user
  WHERE public_user.auth_user_id = auth_user.id
)
ON CONFLICT (auth_user_id) DO NOTHING;

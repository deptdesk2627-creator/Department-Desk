CREATE OR REPLACE FUNCTION public.set_app_metadata_role_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  signup_role text;
BEGIN
  signup_role := COALESCE(
    NULLIF(pg_catalog.btrim(NEW.raw_user_meta_data ->> 'role'), ''),
    'staff'
  );

  IF signup_role NOT IN ('secretary', 'dean', 'staff') THEN
    signup_role := 'staff';
  END IF;

  NEW.raw_user_meta_data := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb)
    || pg_catalog.jsonb_build_object('role', signup_role);
  NEW.raw_app_meta_data := COALESCE(NEW.raw_app_meta_data, '{}'::jsonb)
    || pg_catalog.jsonb_build_object('role', signup_role);

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.set_app_metadata_role_on_signup()
FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created_set_app_metadata_role
ON auth.users;

CREATE TRIGGER on_auth_user_created_set_app_metadata_role
BEFORE INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.set_app_metadata_role_on_signup();

UPDATE auth.users AS auth_user
SET raw_app_meta_data = COALESCE(auth_user.raw_app_meta_data, '{}'::jsonb)
  || pg_catalog.jsonb_build_object('role', public_user.role)
FROM public.users AS public_user
WHERE public_user.auth_user_id = auth_user.id
  AND public_user.role IN ('secretary', 'dean', 'staff')
  AND auth_user.raw_app_meta_data ->> 'role' IS DISTINCT FROM public_user.role;

CREATE OR REPLACE FUNCTION public.get_signup_role_availability()
RETURNS TABLE (role text, is_available boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT role_limits.role, role_limits.is_available
  FROM (
    SELECT
      'secretary'::text AS role,
      (
        SELECT COUNT(*)::integer < 3
        FROM public.users
        WHERE public.users.role = 'secretary'
      ) AS is_available
    UNION ALL
    SELECT
      'dean'::text AS role,
      (
        SELECT COUNT(*)::integer < 1
        FROM public.users
        WHERE public.users.role = 'dean'
      ) AS is_available
    UNION ALL
    SELECT 'staff'::text AS role, true AS is_available
  ) AS role_limits;
$$;

REVOKE ALL ON FUNCTION public.get_signup_role_availability()
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_signup_role_availability()
TO anon, authenticated;

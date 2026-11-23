-- Harden signup role metadata, protect auth.users role updates,
-- enforce column-level update checks on items_masterlist,
-- allow secretary deletes on inventory_transactions,
-- and allow users to sync their own display username safely.

CREATE OR REPLACE FUNCTION public.set_app_metadata_role_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  signup_role text;
  role_limit integer;
  current_role_count integer;
BEGIN
  signup_role := COALESCE(
    NULLIF(pg_catalog.btrim(NEW.raw_user_meta_data ->> 'role'), ''),
    'staff'
  );

  IF signup_role NOT IN ('secretary', 'dean', 'staff') THEN
    signup_role := 'staff';
  END IF;

  role_limit := CASE signup_role
    WHEN 'secretary' THEN 3
    WHEN 'dean' THEN 1
    ELSE NULL
  END;

  IF role_limit IS NOT NULL THEN
    PERFORM pg_catalog.pg_advisory_xact_lock(
      pg_catalog.hashtext('public.users.signup.' || signup_role)
    );

    SELECT COUNT(*)::integer
    INTO current_role_count
    FROM public.users
    WHERE public.users.role = signup_role;

    IF current_role_count >= role_limit THEN
      RAISE EXCEPTION 'The % role has reached its signup limit.', signup_role
        USING ERRCODE = '23514';
    END IF;
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

CREATE OR REPLACE FUNCTION public.protect_user_role_metadata()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  preserved_role text;
BEGIN
  IF (NEW.raw_app_meta_data ->> 'role') IS DISTINCT FROM (OLD.raw_app_meta_data ->> 'role') THEN
    preserved_role := COALESCE(
      NULLIF(pg_catalog.btrim(NEW.raw_app_meta_data ->> 'role'), ''),
      NULLIF(pg_catalog.btrim(OLD.raw_app_meta_data ->> 'role'), ''),
      NULLIF(pg_catalog.btrim(OLD.raw_user_meta_data ->> 'role'), ''),
      'staff'
    );
  ELSE
    preserved_role := COALESCE(
      NULLIF(pg_catalog.btrim(OLD.raw_app_meta_data ->> 'role'), ''),
      NULLIF(pg_catalog.btrim(OLD.raw_user_meta_data ->> 'role'), ''),
      'staff'
    );
  END IF;

  NEW.raw_user_meta_data := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb)
    || pg_catalog.jsonb_build_object('role', preserved_role);

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.protect_user_role_metadata()
FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_users_protect_role_metadata
ON auth.users;

CREATE TRIGGER on_auth_users_protect_role_metadata
BEFORE UPDATE ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.protect_user_role_metadata();

CREATE OR REPLACE FUNCTION public.enforce_items_masterlist_update_guard()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  caller_role text;
BEGIN
  IF NEW.stock_onhand IS NULL OR NEW.stock_onhand < 0 THEN
    RAISE EXCEPTION 'stock_onhand must be non-negative.'
      USING ERRCODE = '23514';
  END IF;

  caller_role := COALESCE((SELECT auth.jwt() -> 'app_metadata' ->> 'role'), '');

  IF current_user IN ('authenticated', 'anon') AND caller_role <> 'secretary' THEN
    IF NEW.item_id IS DISTINCT FROM OLD.item_id
       OR NEW.item_name IS DISTINCT FROM OLD.item_name
       OR NEW.unit IS DISTINCT FROM OLD.unit
       OR NEW.min_stock IS DISTINCT FROM OLD.min_stock
       OR NEW.category IS DISTINCT FROM OLD.category
       OR NEW.classification IS DISTINCT FROM OLD.classification
       OR NEW.archived_at IS DISTINCT FROM OLD.archived_at
       OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
      RAISE EXCEPTION 'Only secretaries can modify inventory item metadata.'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS before_items_masterlist_update_guard
ON public.items_masterlist;

CREATE TRIGGER before_items_masterlist_update_guard
BEFORE UPDATE ON public.items_masterlist
FOR EACH ROW
EXECUTE FUNCTION public.enforce_items_masterlist_update_guard();

GRANT DELETE ON public.inventory_transactions TO authenticated;

DROP POLICY IF EXISTS inventory_transactions_delete_for_secretary
ON public.inventory_transactions;

CREATE POLICY inventory_transactions_delete_for_secretary
ON public.inventory_transactions
FOR DELETE
TO authenticated
USING (
  (SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'secretary'
);

GRANT UPDATE (username) ON public.users TO authenticated;

DROP POLICY IF EXISTS users_update_self_username
ON public.users;

CREATE POLICY users_update_self_username
ON public.users
FOR UPDATE
TO authenticated
USING (
  auth_user_id = (SELECT auth.uid())
)
WITH CHECK (
  auth_user_id = (SELECT auth.uid())
  AND role = (SELECT auth.jwt() -> 'app_metadata' ->> 'role')
);

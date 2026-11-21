-- Finalize CICT MVP database and RLS guards:
-- 1. Enforce stock_onhand increase guard for all non-secretaries without a valid dean/secretary role.
-- 2. Enforce positive quantity and strict (action_type, status) pairing on inventory_transactions.
-- 3. Case-normalize role checks in signup availability and auth signup triggers.

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

  caller_role := pg_catalog.lower(
    pg_catalog.btrim(
      COALESCE(
        NULLIF((SELECT auth.jwt() -> 'app_metadata' ->> 'role'), ''),
        (
          SELECT u.role
          FROM public.users AS u
          WHERE u.auth_user_id = (SELECT auth.uid())
          LIMIT 1
        ),
        ''
      )
    )
  );

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

    -- Staff returns (and callers without a verified secretary/dean role) require secretary confirmation before stock is restored.
    IF caller_role NOT IN ('secretary', 'dean') AND NEW.stock_onhand > OLD.stock_onhand THEN
      RAISE EXCEPTION 'Staff cannot increase stock_onhand directly; returns must be confirmed by a secretary.'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_constraint
    WHERE conname = 'inventory_transactions_quantity_positive'
      AND conrelid = 'public.inventory_transactions'::regclass
  ) THEN
    ALTER TABLE public.inventory_transactions
      ADD CONSTRAINT inventory_transactions_quantity_positive
      CHECK (quantity > 0) NOT VALID;
  END IF;
END $$;

DROP POLICY IF EXISTS inventory_transactions_insert_by_role
ON public.inventory_transactions;

CREATE POLICY inventory_transactions_insert_by_role
ON public.inventory_transactions
FOR INSERT
TO authenticated
WITH CHECK (
  quantity > 0
  AND (
    (SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'secretary'
    OR (
      (SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'dean'
      AND is_issued_to IN (
        SELECT user_id
        FROM public.users
        WHERE auth_user_id = (SELECT auth.uid())
      )
      AND (
        (action_type = 'Borrow' AND status = 'Borrowed')
        OR (action_type = 'Use' AND status = 'Used')
        OR (action_type = 'Return' AND status = 'Returned')
      )
    )
    OR (
      (SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'staff'
      AND is_issued_to IN (
        SELECT user_id
        FROM public.users
        WHERE auth_user_id = (SELECT auth.uid())
      )
      AND (
        (action_type = 'Borrow' AND status = 'Borrowed')
        OR (action_type = 'Use' AND status = 'Used')
        OR (
          action_type = 'Return'
          AND status = 'Pending Return'
          AND return_date IS NULL
          AND recieved_by IS NULL
        )
      )
    )
  )
);

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
        WHERE pg_catalog.lower(pg_catalog.btrim(public.users.role)) = 'secretary'
      ) AS is_available
    UNION ALL
    SELECT
      'dean'::text AS role,
      (
        SELECT COUNT(*)::integer < 1
        FROM public.users
        WHERE pg_catalog.lower(pg_catalog.btrim(public.users.role)) = 'dean'
      ) AS is_available
    UNION ALL
    SELECT 'staff'::text AS role, true AS is_available
  ) AS role_limits;
$$;

REVOKE ALL ON FUNCTION public.get_signup_role_availability()
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_signup_role_availability()
TO anon, authenticated;

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
    NULLIF(pg_catalog.lower(pg_catalog.btrim(NEW.raw_user_meta_data ->> 'role')), ''),
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
    WHERE pg_catalog.lower(pg_catalog.btrim(public.users.role)) = signup_role;

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
    NULLIF(pg_catalog.btrim(NEW.raw_user_meta_data ->> 'full_name'), ''),
    NULLIF(pg_catalog.split_part(COALESCE(NEW.email, ''), '@', 1), ''),
    'User'
  );
  profile_role := COALESCE(
    NULLIF(pg_catalog.lower(pg_catalog.btrim(NEW.raw_user_meta_data ->> 'role')), ''),
    'staff'
  );

  IF profile_role NOT IN ('secretary', 'dean', 'staff') THEN
    profile_role := 'staff';
  END IF;

  role_limit := CASE profile_role
    WHEN 'secretary' THEN 3
    WHEN 'dean' THEN 1
    ELSE NULL
  END;

  IF role_limit IS NOT NULL THEN
    PERFORM pg_catalog.pg_advisory_xact_lock(
      pg_catalog.hashtext('public.users.signup.' || profile_role)
    );

    SELECT COUNT(*)::integer
    INTO current_role_count
    FROM public.users
    WHERE pg_catalog.lower(pg_catalog.btrim(public.users.role)) = profile_role;

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

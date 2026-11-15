ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items_masterlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.users TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.items_masterlist TO authenticated;
GRANT SELECT, INSERT ON public.inventory_transactions TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.items_item_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.inventory_transaction_id_seq TO authenticated;

DROP POLICY IF EXISTS users_select_self_and_inventory_managers
ON public.users;
CREATE POLICY users_select_self_and_inventory_managers
ON public.users
FOR SELECT
TO authenticated
USING (
  auth_user_id = (SELECT auth.uid())
  OR (SELECT auth.jwt() -> 'app_metadata' ->> 'role') IN ('secretary', 'dean')
);

DROP POLICY IF EXISTS items_masterlist_select_for_app_roles
ON public.items_masterlist;
CREATE POLICY items_masterlist_select_for_app_roles
ON public.items_masterlist
FOR SELECT
TO authenticated
USING (
  (SELECT auth.jwt() -> 'app_metadata' ->> 'role') IN ('secretary', 'dean', 'staff')
);

DROP POLICY IF EXISTS items_masterlist_insert_for_secretary
ON public.items_masterlist;
CREATE POLICY items_masterlist_insert_for_secretary
ON public.items_masterlist
FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'secretary'
);

DROP POLICY IF EXISTS items_masterlist_update_for_inventory_users
ON public.items_masterlist;
CREATE POLICY items_masterlist_update_for_inventory_users
ON public.items_masterlist
FOR UPDATE
TO authenticated
USING (
  (SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'secretary'
  OR (
    (SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'staff'
    AND archived_at IS NULL
  )
)
WITH CHECK (
  (SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'secretary'
  OR (
    (SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'staff'
    AND archived_at IS NULL
    AND stock_onhand >= 0
  )
);

DROP POLICY IF EXISTS inventory_transactions_select_by_role
ON public.inventory_transactions;
CREATE POLICY inventory_transactions_select_by_role
ON public.inventory_transactions
FOR SELECT
TO authenticated
USING (
  (SELECT auth.jwt() -> 'app_metadata' ->> 'role') IN ('secretary', 'dean')
  OR (
    (SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'staff'
    AND is_issued_to IN (
      SELECT user_id
      FROM public.users
      WHERE auth_user_id = (SELECT auth.uid())
    )
  )
);

DROP POLICY IF EXISTS inventory_transactions_insert_by_role
ON public.inventory_transactions;
CREATE POLICY inventory_transactions_insert_by_role
ON public.inventory_transactions
FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'secretary'
  OR (
    (SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'staff'
    AND is_issued_to IN (
      SELECT user_id
      FROM public.users
      WHERE auth_user_id = (SELECT auth.uid())
    )
  )
);

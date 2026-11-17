DROP POLICY IF EXISTS items_masterlist_update_for_inventory_users
ON public.items_masterlist;

CREATE POLICY items_masterlist_update_for_inventory_users
ON public.items_masterlist
FOR UPDATE
TO authenticated
USING (
  (SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'secretary'
  OR (
    (SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'dean'
    AND archived_at IS NULL
  )
  OR (
    archived_at IS NULL
    AND EXISTS (
      SELECT 1
      FROM public.users
      WHERE auth_user_id = (SELECT auth.uid())
        AND role = 'staff'
    )
  )
)
WITH CHECK (
  (SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'secretary'
  OR (
    (SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'dean'
    AND archived_at IS NULL
    AND stock_onhand >= 0
  )
  OR (
    archived_at IS NULL
    AND stock_onhand >= 0
    AND EXISTS (
      SELECT 1
      FROM public.users
      WHERE auth_user_id = (SELECT auth.uid())
        AND role = 'staff'
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
    (SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'dean'
    AND is_issued_to IN (
      SELECT user_id
      FROM public.users
      WHERE auth_user_id = (SELECT auth.uid())
    )
  )
  OR (
    (SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'staff'
    AND is_issued_to IN (
      SELECT user_id
      FROM public.users
      WHERE auth_user_id = (SELECT auth.uid())
    )
  )
);

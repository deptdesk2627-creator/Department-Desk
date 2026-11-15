DROP POLICY IF EXISTS items_masterlist_update_for_inventory_users
ON public.items_masterlist;

CREATE POLICY items_masterlist_update_for_inventory_users
ON public.items_masterlist
FOR UPDATE
TO authenticated
USING (
  (SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'secretary'
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

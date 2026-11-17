GRANT UPDATE ON public.inventory_transactions TO authenticated;

DROP POLICY IF EXISTS inventory_transactions_update_for_secretary
ON public.inventory_transactions;

CREATE POLICY inventory_transactions_update_for_secretary
ON public.inventory_transactions
FOR UPDATE
TO authenticated
USING (
  (SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'secretary'
  OR EXISTS (
    SELECT 1
    FROM public.users
    WHERE auth_user_id = (SELECT auth.uid())
      AND role = 'secretary'
  )
)
WITH CHECK (
  (SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'secretary'
  OR EXISTS (
    SELECT 1
    FROM public.users
    WHERE auth_user_id = (SELECT auth.uid())
      AND role = 'secretary'
  )
);

-- Enforce staff return confirmation workflow and stock direction rules at the database level.
-- Prevents staff from inserting already-confirmed 'Returned' rows or directly increasing stock_onhand.

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

    -- Staff returns require secretary confirmation before stock is restored.
    IF caller_role = 'staff' AND NEW.stock_onhand > OLD.stock_onhand THEN
      RAISE EXCEPTION 'Staff cannot increase stock_onhand directly; returns must be confirmed by a secretary.'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

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
    AND status IN ('Borrowed', 'Used', 'Returned')
  )
  OR (
    (SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'staff'
    AND is_issued_to IN (
      SELECT user_id
      FROM public.users
      WHERE auth_user_id = (SELECT auth.uid())
    )
    AND status IN ('Borrowed', 'Used', 'Pending Return')
    AND (
      action_type <> 'Return'
      OR (status = 'Pending Return' AND return_date IS NULL AND recieved_by IS NULL)
    )
  )
);

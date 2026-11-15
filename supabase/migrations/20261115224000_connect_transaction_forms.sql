ALTER TABLE public.transaction_history
  ADD COLUMN IF NOT EXISTS transaction_table text
    NOT NULL DEFAULT 'transactions_ongoing'
    CHECK (transaction_table IN ('transactions_ongoing', 'transactions_incoming'));

ALTER TABLE public.offices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_location ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.offices TO authenticated;
GRANT SELECT, INSERT ON public.file_location TO authenticated;
GRANT USAGE, SELECT
ON SEQUENCE public.file_location_location_id_seq
TO authenticated;

DROP POLICY IF EXISTS offices_select_for_transaction_users
ON public.offices;
CREATE POLICY offices_select_for_transaction_users
ON public.offices
FOR SELECT
TO authenticated
USING (
  (SELECT auth.jwt() -> 'app_metadata' ->> 'role') IN ('secretary', 'dean')
);

DROP POLICY IF EXISTS file_location_select_for_transaction_users
ON public.file_location;
CREATE POLICY file_location_select_for_transaction_users
ON public.file_location
FOR SELECT
TO authenticated
USING (
  (SELECT auth.jwt() -> 'app_metadata' ->> 'role') IN ('secretary', 'dean')
);

DROP POLICY IF EXISTS file_location_insert_for_secretary
ON public.file_location;
CREATE POLICY file_location_insert_for_secretary
ON public.file_location
FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'secretary'
);

DROP POLICY IF EXISTS transactions_ongoing_select_for_dean
ON public.transactions_ongoing;
CREATE POLICY transactions_ongoing_select_for_dean
ON public.transactions_ongoing
FOR SELECT
TO authenticated
USING (
  (SELECT auth.jwt() -> 'app_metadata' ->> 'role') IN ('secretary', 'dean')
);

DROP POLICY IF EXISTS transactions_incoming_select_for_dean
ON public.transactions_incoming;
CREATE POLICY transactions_incoming_select_for_dean
ON public.transactions_incoming
FOR SELECT
TO authenticated
USING (
  (SELECT auth.jwt() -> 'app_metadata' ->> 'role') IN ('secretary', 'dean')
);

DROP POLICY IF EXISTS transaction_history_select_for_dean
ON public.transaction_history;
CREATE POLICY transaction_history_select_for_dean
ON public.transaction_history
FOR SELECT
TO authenticated
USING (
  (SELECT auth.jwt() -> 'app_metadata' ->> 'role') IN ('secretary', 'dean')
);

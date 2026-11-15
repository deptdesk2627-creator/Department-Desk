ALTER TABLE public.transactions_ongoing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions_incoming ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_history ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE
ON public.transactions_ongoing, public.transactions_incoming, public.transaction_history
TO authenticated;

GRANT USAGE, SELECT
ON SEQUENCE
  public.transactions_ongoing_request_id_seq,
  public.transactions_incoming_request_id_seq
TO authenticated;

DROP POLICY IF EXISTS transactions_ongoing_secretary_all
ON public.transactions_ongoing;
CREATE POLICY transactions_ongoing_secretary_all
ON public.transactions_ongoing
FOR ALL
TO authenticated
USING (
  (SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'secretary'
)
WITH CHECK (
  (SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'secretary'
);

DROP POLICY IF EXISTS transactions_incoming_secretary_all
ON public.transactions_incoming;
CREATE POLICY transactions_incoming_secretary_all
ON public.transactions_incoming
FOR ALL
TO authenticated
USING (
  (SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'secretary'
)
WITH CHECK (
  (SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'secretary'
);

DROP POLICY IF EXISTS transaction_history_secretary_all
ON public.transaction_history;
CREATE POLICY transaction_history_secretary_all
ON public.transaction_history
FOR ALL
TO authenticated
USING (
  (SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'secretary'
)
WITH CHECK (
  (SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'secretary'
);

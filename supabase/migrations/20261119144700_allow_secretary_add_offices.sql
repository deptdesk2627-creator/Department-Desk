GRANT INSERT ON public.offices TO authenticated;
GRANT USAGE, SELECT
ON SEQUENCE public.offices_office_id_seq
TO authenticated;

DROP POLICY IF EXISTS offices_insert_for_secretary
ON public.offices;
CREATE POLICY offices_insert_for_secretary
ON public.offices
FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'secretary'
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE
ON public.tasks
TO authenticated;

GRANT USAGE, SELECT
ON SEQUENCE public.tasks_task_id_seq
TO authenticated;

DROP POLICY IF EXISTS tasks_manage_for_secretary_and_dean
ON public.tasks;

CREATE POLICY tasks_manage_for_secretary_and_dean
ON public.tasks
FOR ALL
TO authenticated
USING (
  (SELECT auth.jwt() -> 'app_metadata' ->> 'role') IN ('secretary', 'dean')
)
WITH CHECK (
  (SELECT auth.jwt() -> 'app_metadata' ->> 'role') IN ('secretary', 'dean')
);

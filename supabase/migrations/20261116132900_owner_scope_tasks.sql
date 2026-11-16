ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE
ON public.tasks
TO authenticated;

DROP POLICY IF EXISTS tasks_manage_for_secretary_and_dean
ON public.tasks;
DROP POLICY IF EXISTS tasks_select_own
ON public.tasks;
DROP POLICY IF EXISTS tasks_insert_own
ON public.tasks;
DROP POLICY IF EXISTS tasks_update_own
ON public.tasks;
DROP POLICY IF EXISTS tasks_delete_own
ON public.tasks;

CREATE POLICY tasks_select_own
ON public.tasks
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.users AS task_owner
    WHERE task_owner.user_id = tasks.tasks_user_id
      AND task_owner.auth_user_id = (SELECT auth.uid())
  )
);

CREATE POLICY tasks_insert_own
ON public.tasks
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.users AS task_owner
    WHERE task_owner.user_id = tasks.tasks_user_id
      AND task_owner.auth_user_id = (SELECT auth.uid())
  )
);

CREATE POLICY tasks_update_own
ON public.tasks
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.users AS task_owner
    WHERE task_owner.user_id = tasks.tasks_user_id
      AND task_owner.auth_user_id = (SELECT auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.users AS task_owner
    WHERE task_owner.user_id = tasks.tasks_user_id
      AND task_owner.auth_user_id = (SELECT auth.uid())
  )
);

CREATE POLICY tasks_delete_own
ON public.tasks
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.users AS task_owner
    WHERE task_owner.user_id = tasks.tasks_user_id
      AND task_owner.auth_user_id = (SELECT auth.uid())
  )
);

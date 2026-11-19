-- Idempotent sample data for Supabase SQL Editor.
-- Uses existing public.users, public.offices, and file_location rows.
-- Sample stock reflects the transactions below:
--   projector: 5 opening - 2 borrowed + 1 returned = 4 on hand
--   paper:     40 opening - 12 used = 28 on hand

BEGIN;

DO $seed$
DECLARE
  v_secretary_id integer;
  v_secretary_name text;
  v_borrower_id integer;
  v_borrower_name text;
  v_secretary_office_id bigint;
  v_registrar_office_id bigint;
  v_finance_office_id bigint;
  v_projector_id integer;
  v_paper_id integer;
  v_sec_location_id bigint;
  v_incoming_location_id bigint;
  v_outgoing_request_id integer;
  v_incoming_request_id integer;
BEGIN
  SELECT
    app_user.user_id,
    COALESCE(NULLIF(BTRIM(app_user.username), ''), 'Secretary')
  INTO v_secretary_id, v_secretary_name
  FROM public.users AS app_user
  WHERE LOWER(BTRIM(app_user.role)) = 'secretary'
    AND app_user.auth_user_id IS NOT NULL
  ORDER BY app_user.user_id
  LIMIT 1;

  IF v_secretary_id IS NULL THEN
    RAISE EXCEPTION
      'Sample data requires a linked Secretary row in public.users.';
  END IF;

  SELECT
    app_user.user_id,
    COALESCE(NULLIF(BTRIM(app_user.username), ''), 'Inventory borrower')
  INTO v_borrower_id, v_borrower_name
  FROM public.users AS app_user
  WHERE LOWER(BTRIM(app_user.role)) IN ('staff', 'dean')
    AND app_user.auth_user_id IS NOT NULL
  ORDER BY
    CASE LOWER(BTRIM(app_user.role))
      WHEN 'staff' THEN 1
      WHEN 'dean' THEN 2
      ELSE 3
    END,
    app_user.user_id
  LIMIT 1;

  IF v_borrower_id IS NULL THEN
    v_borrower_id := v_secretary_id;
    v_borrower_name := v_secretary_name;
  END IF;

  INSERT INTO public.offices (name)
  SELECT expected.name
  FROM (
    VALUES
      ('Secretary''s Office'),
      ('Registrar'),
      ('Finance Office')
  ) AS expected(name)
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.offices AS existing
    WHERE LOWER(BTRIM(existing.name)) = LOWER(expected.name)
  );

  SELECT office_id
  INTO v_secretary_office_id
  FROM public.offices
  WHERE LOWER(BTRIM(name)) = LOWER('Secretary''s Office')
  ORDER BY office_id
  LIMIT 1;

  SELECT office_id
  INTO v_registrar_office_id
  FROM public.offices
  WHERE LOWER(BTRIM(name)) = LOWER('Registrar')
  ORDER BY office_id
  LIMIT 1;

  SELECT office_id
  INTO v_finance_office_id
  FROM public.offices
  WHERE LOWER(BTRIM(name)) = LOWER('Finance Office')
  ORDER BY office_id
  LIMIT 1;

  INSERT INTO public.file_location (cabinet, drawer, section)
  SELECT expected.cabinet, expected.drawer, NULL
  FROM (
    VALUES
      ('CICT Cabinet 4 (College Sec)', 'Cab4 D1'),
      ('CICT Cabinet 4 (College Sec)', 'Cab4 D2')
  ) AS expected(cabinet, drawer)
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.file_location AS existing
    WHERE LOWER(BTRIM(existing.cabinet)) = LOWER(expected.cabinet)
      AND LOWER(BTRIM(existing.drawer)) = LOWER(expected.drawer)
  );

  SELECT location_id
  INTO v_sec_location_id
  FROM public.file_location
  WHERE LOWER(BTRIM(cabinet)) = LOWER('CICT Cabinet 4 (College Sec)')
    AND LOWER(BTRIM(drawer)) = LOWER('Cab4 D1')
  ORDER BY location_id
  LIMIT 1;

  SELECT location_id
  INTO v_incoming_location_id
  FROM public.file_location
  WHERE LOWER(BTRIM(cabinet)) = LOWER('CICT Cabinet 4 (College Sec)')
    AND LOWER(BTRIM(drawer)) = LOWER('Cab4 D2')
  ORDER BY location_id
  LIMIT 1;

  INSERT INTO public.items_masterlist (
    item_name,
    stock_onhand,
    unit,
    min_stock,
    category,
    classification,
    archived_at,
    created_at
  )
  SELECT
    '[Sample] Projector',
    4,
    'pieces',
    1,
    'Equipment',
    'Borrowable',
    NULL,
    DATE '2026-10-15'
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.items_masterlist
    WHERE item_name = '[Sample] Projector'
      AND archived_at IS NULL
  );

  SELECT item_id
  INTO v_projector_id
  FROM public.items_masterlist
  WHERE item_name = '[Sample] Projector'
    AND archived_at IS NULL
  ORDER BY item_id
  LIMIT 1;

  INSERT INTO public.items_masterlist (
    item_name,
    stock_onhand,
    unit,
    min_stock,
    category,
    classification,
    archived_at,
    created_at
  )
  SELECT
    '[Sample] A4 Bond Paper',
    28,
    'reams',
    8,
    'Supplies',
    'Usable',
    NULL,
    DATE '2026-10-15'
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.items_masterlist
    WHERE item_name = '[Sample] A4 Bond Paper'
      AND archived_at IS NULL
  );

  SELECT item_id
  INTO v_paper_id
  FROM public.items_masterlist
  WHERE item_name = '[Sample] A4 Bond Paper'
    AND archived_at IS NULL
  ORDER BY item_id
  LIMIT 1;

  INSERT INTO public.inventory_transactions (
    item_id,
    is_issued_to,
    purpose,
    quantity,
    action_type,
    return_date,
    borrow_date,
    status,
    unit,
    created_at,
    recieved_by,
    returned_by
  )
  SELECT
    v_projector_id,
    v_borrower_id,
    'Sample data: projector borrowed for a department lecture',
    2,
    'Borrow',
    NULL,
    DATE '2026-11-12',
    'Borrowed',
    'pieces',
    TIMESTAMPTZ '2026-11-12 09:00:00+08',
    NULL,
    NULL
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.inventory_transactions
    WHERE item_id = v_projector_id
      AND is_issued_to = v_borrower_id
      AND action_type = 'Borrow'
      AND purpose = 'Sample data: projector borrowed for a department lecture'
  );

  INSERT INTO public.inventory_transactions (
    item_id,
    is_issued_to,
    purpose,
    quantity,
    action_type,
    return_date,
    borrow_date,
    status,
    unit,
    created_at,
    recieved_by,
    returned_by
  )
  SELECT
    v_projector_id,
    v_borrower_id,
    'Sample data: one projector returned after the lecture',
    1,
    'Return',
    DATE '2026-11-13',
    DATE '2026-11-12',
    'Returned',
    'pieces',
    TIMESTAMPTZ '2026-11-13 15:30:00+08',
    v_secretary_name,
    v_borrower_name
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.inventory_transactions
    WHERE item_id = v_projector_id
      AND is_issued_to = v_borrower_id
      AND action_type = 'Return'
      AND purpose = 'Sample data: one projector returned after the lecture'
  );

  INSERT INTO public.inventory_transactions (
    item_id,
    is_issued_to,
    purpose,
    quantity,
    action_type,
    return_date,
    borrow_date,
    status,
    unit,
    created_at,
    recieved_by,
    returned_by
  )
  SELECT
    v_paper_id,
    v_borrower_id,
    'Sample data: printed department handouts',
    12,
    'Use',
    NULL,
    NULL,
    'Used',
    'reams',
    TIMESTAMPTZ '2026-11-14 10:15:00+08',
    NULL,
    NULL
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.inventory_transactions
    WHERE item_id = v_paper_id
      AND is_issued_to = v_borrower_id
      AND action_type = 'Use'
      AND purpose = 'Sample data: printed department handouts'
  );

  INSERT INTO public.transactions_ongoing (
    request_name,
    requested_by,
    request_date,
    origin_office,
    current_office,
    category,
    status,
    notes,
    released_date,
    req_user_id,
    file_location,
    archived_at,
    updated_at,
    created_at
  )
  SELECT
    '[Sample] Classroom projector request',
    'Jordan Lee',
    EXTRACT(EPOCH FROM TIMESTAMPTZ '2026-11-12 08:30:00+08')::integer,
    v_secretary_office_id,
    v_registrar_office_id,
    'Request',
    'Approved',
    'Sample request for classroom equipment review.',
    NULL,
    v_secretary_id,
    v_sec_location_id,
    NULL,
    TIMESTAMP '2026-11-14 11:00:00',
    TIMESTAMP '2026-11-12 08:30:00'
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.transactions_ongoing
    WHERE request_name = '[Sample] Classroom projector request'
      AND req_user_id = v_secretary_id
  )
  RETURNING request_id INTO v_outgoing_request_id;

  IF v_outgoing_request_id IS NULL THEN
    SELECT request_id
    INTO v_outgoing_request_id
    FROM public.transactions_ongoing
    WHERE request_name = '[Sample] Classroom projector request'
      AND req_user_id = v_secretary_id
    ORDER BY request_id
    LIMIT 1;
  END IF;

  INSERT INTO public.transactions_incoming (
    request_name,
    requested_by,
    request_date,
    origin_office,
    current_office,
    category,
    status,
    notes,
    released_date,
    req_user_id,
    file_location,
    signature_status,
    forwarded_to,
    archived_at,
    updated_at,
    created_at
  )
  SELECT
    '[Sample] Signed equipment delivery memo',
    'Morgan Cruz',
    EXTRACT(EPOCH FROM TIMESTAMPTZ '2026-11-14 09:00:00+08')::integer,
    v_finance_office_id,
    v_secretary_office_id,
    'Document',
    'Sent Out',
    'Sample memo received from Finance and forwarded to the Registrar.',
    NULL,
    v_secretary_id,
    v_incoming_location_id,
    'Signed by Dean',
    v_registrar_office_id,
    NULL,
    TIMESTAMP '2026-11-16 13:15:00',
    TIMESTAMP '2026-11-14 09:00:00'
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.transactions_incoming
    WHERE request_name = '[Sample] Signed equipment delivery memo'
      AND req_user_id = v_secretary_id
  )
  RETURNING request_id INTO v_incoming_request_id;

  IF v_incoming_request_id IS NULL THEN
    SELECT request_id
    INTO v_incoming_request_id
    FROM public.transactions_incoming
    WHERE request_name = '[Sample] Signed equipment delivery memo'
      AND req_user_id = v_secretary_id
    ORDER BY request_id
    LIMIT 1;
  END IF;

  INSERT INTO public.transaction_history (
    request_id,
    changed_by,
    field,
    old_value,
    new_value,
    changed_at,
    transaction_table
  )
  SELECT
    event.request_id,
    event.changed_by,
    event.field,
    event.old_value,
    event.new_value,
    event.changed_at,
    event.transaction_table
  FROM (
    VALUES
    (
      v_outgoing_request_id,
      v_secretary_name,
      'status',
      NULL,
      'Pending',
      TIMESTAMP '2026-11-12 08:30:00',
      'transactions_ongoing'
    ),
    (
      v_outgoing_request_id,
      v_secretary_name,
      'file_location',
      NULL,
      'In Process (Not yet filed)',
      TIMESTAMP '2026-11-12 08:30:00',
      'transactions_ongoing'
    ),
    (
      v_outgoing_request_id,
      v_secretary_name,
      'status',
      'Pending',
      'Under Review',
      TIMESTAMP '2026-11-13 10:00:00',
      'transactions_ongoing'
    ),
    (
      v_outgoing_request_id,
      v_secretary_name,
      'status',
      'Under Review',
      'Approved',
      TIMESTAMP '2026-11-14 11:00:00',
      'transactions_ongoing'
    ),
    (
      v_outgoing_request_id,
      v_secretary_name,
      'file_location',
      'In Process (Not yet filed)',
      'CICT Cabinet 4 - D1',
      TIMESTAMP '2026-11-14 11:00:00',
      'transactions_ongoing'
    ),
    (
      v_incoming_request_id,
      v_secretary_name,
      'status',
      NULL,
      'Received',
      TIMESTAMP '2026-11-14 09:00:00',
      'transactions_incoming'
    ),
    (
      v_incoming_request_id,
      v_secretary_name,
      'signature_status',
      NULL,
      'Unsigned',
      TIMESTAMP '2026-11-14 09:00:00',
      'transactions_incoming'
    ),
    (
      v_incoming_request_id,
      v_secretary_name,
      'status',
      'Received',
      'For Signature',
      TIMESTAMP '2026-11-15 09:00:00',
      'transactions_incoming'
    ),
    (
      v_incoming_request_id,
      v_secretary_name,
      'signature_status',
      'Unsigned',
      'Signed by Dean',
      TIMESTAMP '2026-11-15 10:30:00',
      'transactions_incoming'
    ),
    (
      v_incoming_request_id,
      v_secretary_name,
      'status',
      'For Signature',
      'Signed by Office',
      TIMESTAMP '2026-11-15 10:30:00',
      'transactions_incoming'
    ),
    (
      v_incoming_request_id,
      v_secretary_name,
      'file_location',
      NULL,
      'CICT Cabinet 4 - D2',
      TIMESTAMP '2026-11-15 11:00:00',
      'transactions_incoming'
    ),
    (
      v_incoming_request_id,
      v_secretary_name,
      'status',
      'Signed by Office',
      'Sent Out',
      TIMESTAMP '2026-11-16 13:15:00',
      'transactions_incoming'
    ),
    (
      v_incoming_request_id,
      v_secretary_name,
      'forwarded_to',
      'Not sent out',
      'Registrar',
      TIMESTAMP '2026-11-16 13:15:00',
      'transactions_incoming'
    )
  ) AS event(
    request_id,
    changed_by,
    field,
    old_value,
    new_value,
    changed_at,
    transaction_table
  )
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.transaction_history AS existing
    WHERE existing.request_id = event.request_id
      AND existing.transaction_table = event.transaction_table
      AND existing.changed_by IS NOT DISTINCT FROM event.changed_by
      AND existing.field IS NOT DISTINCT FROM event.field
      AND existing.old_value IS NOT DISTINCT FROM event.old_value
      AND existing.new_value IS NOT DISTINCT FROM event.new_value
      AND existing.changed_at IS NOT DISTINCT FROM event.changed_at
  );

  INSERT INTO public.tasks (
    task_name,
    priority_level,
    status,
    due_date,
    tasks_user_id,
    description,
    completed_at,
    created_at,
    updated_at
  )
  SELECT
    '[Sample] Prepare November supply report',
    'High',
    'In progress',
    DATE '2026-11-21',
    v_secretary_id,
    'Compile current stock levels and recent inventory transactions.',
    NULL,
    TIMESTAMP '2026-11-12 09:00:00',
    TIMESTAMP '2026-11-16 14:00:00'
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.tasks
    WHERE task_name = '[Sample] Prepare November supply report'
      AND tasks_user_id = v_secretary_id
  );

  INSERT INTO public.tasks (
    task_name,
    priority_level,
    status,
    due_date,
    tasks_user_id,
    description,
    completed_at,
    created_at,
    updated_at
  )
  SELECT
    '[Sample] Process department requests',
    'Medium',
    'Not started',
    DATE '2026-11-24',
    v_secretary_id,
    'Review and route the pending department request forms.',
    NULL,
    TIMESTAMP '2026-11-15 08:30:00',
    TIMESTAMP '2026-11-15 08:30:00'
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.tasks
    WHERE task_name = '[Sample] Process department requests'
      AND tasks_user_id = v_secretary_id
  );

  INSERT INTO public.tasks (
    task_name,
    priority_level,
    status,
    due_date,
    tasks_user_id,
    description,
    completed_at,
    created_at,
    updated_at
  )
  SELECT
    '[Sample] Reconcile equipment log',
    'Low',
    'Done',
    DATE '2026-11-15',
    v_secretary_id,
    'Match the projector borrowing and return entries with the stock balance.',
    TIMESTAMP '2026-11-14 16:00:00',
    TIMESTAMP '2026-11-10 10:00:00',
    TIMESTAMP '2026-11-14 16:00:00'
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.tasks
    WHERE task_name = '[Sample] Reconcile equipment log'
      AND tasks_user_id = v_secretary_id
  );
END;
$seed$;

COMMIT;

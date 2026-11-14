-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.users (
  user_id integer NOT NULL DEFAULT nextval('users_user_id_seq'::regclass),
  username character varying,
  role character varying,
  auth_user_id uuid UNIQUE,
  CONSTRAINT users_pkey PRIMARY KEY (user_id),
  CONSTRAINT users_auth_user_id_fkey FOREIGN KEY (auth_user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.transactions (
  request_id integer NOT NULL DEFAULT nextval('transactions_request_id_seq'::regclass),
  request_name character varying NOT NULL,
  requested_by text NOT NULL,
  request_date integer NOT NULL,
  origin_office bigint NOT NULL,
  current_office bigint NOT NULL,
  category character varying NOT NULL,
  status character varying NOT NULL,
  notes character varying,
  released_date integer,
  req_user_id integer NOT NULL,
  file_location bigint,
  signature_status character varying,
  archived_at timestamp without time zone,
  updated_at timestamp without time zone,
  created_at timestamp without time zone,
  CONSTRAINT transactions_pkey PRIMARY KEY (request_id),
  CONSTRAINT fk_transaction_user FOREIGN KEY (req_user_id) REFERENCES public.users(user_id),
  CONSTRAINT fk_transactions_file_location FOREIGN KEY (file_location) REFERENCES public.file_location(location_id),
  CONSTRAINT fk_transactions_origin_office FOREIGN KEY (origin_office) REFERENCES public.offices(office_id),
  CONSTRAINT fk_transactions_current_office FOREIGN KEY (current_office) REFERENCES public.offices(office_id)
);
CREATE TABLE public.tasks (
  task_id integer NOT NULL DEFAULT nextval('tasks_task_id_seq'::regclass),
  task_name character varying NOT NULL,
  priority_level character varying NOT NULL,
  status character varying NOT NULL,
  due_date date NOT NULL,
  tasks_user_id integer NOT NULL,
  description character varying,
  completed_at timestamp without time zone,
  created_at timestamp without time zone,
  updated_at timestamp without time zone,
  CONSTRAINT tasks_pkey PRIMARY KEY (task_id),
  CONSTRAINT fk_task_user FOREIGN KEY (tasks_user_id) REFERENCES public.users(user_id)
);
CREATE TABLE public.items_masterlist (
  item_id integer NOT NULL DEFAULT nextval('items_item_id_seq'::regclass),
  item_name character varying NOT NULL,
  stock_onhand integer NOT NULL,
  unit character varying NOT NULL,
  min_stock integer NOT NULL,
  category character varying NOT NULL,
  classification character varying NOT NULL,
  archived_at date,
  created_at date,
  CONSTRAINT items_masterlist_pkey PRIMARY KEY (item_id)
);
CREATE TABLE public.inventory_transactions (
  transaction_id integer NOT NULL DEFAULT nextval('inventory_transaction_id_seq'::regclass),
  item_id integer NOT NULL,
  is_issued_to integer NOT NULL,
  purpose character varying NOT NULL,
  quantity integer NOT NULL,
  action_type character varying NOT NULL,
  return_date date,
  borrow_date date,
  status character varying NOT NULL,
  unit character varying NOT NULL,
  created_at timestamp without time zone,
  recieved_by character varying,
  returned_by character varying,
  CONSTRAINT inventory_transactions_pkey PRIMARY KEY (transaction_id),
  CONSTRAINT fk_inventory_user FOREIGN KEY (is_issued_to) REFERENCES public.users(user_id),
  CONSTRAINT fk_inventory_item FOREIGN KEY (item_id) REFERENCES public.items_masterlist(item_id)
);
CREATE TABLE public.file_location (
  location_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  drawer smallint NOT NULL,
  cabinet character varying,
  section character varying,
  CONSTRAINT file_location_pkey PRIMARY KEY (location_id)
);
CREATE TABLE public.offices (
  office_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  name character varying NOT NULL,
  CONSTRAINT offices_pkey PRIMARY KEY (office_id)
);
CREATE TABLE public.transaction_history (
  record_id uuid NOT NULL DEFAULT gen_random_uuid(),
  request_id bigint NOT NULL,
  changed_by character varying,
  field character varying,
  old_value character varying,
  new_value character varying,
  changed_at timestamp without time zone,
  CONSTRAINT transaction_history_pkey PRIMARY KEY (record_id),
  CONSTRAINT fk_transaction_history_request FOREIGN KEY (request_id) REFERENCES public.transactions(request_id)
);
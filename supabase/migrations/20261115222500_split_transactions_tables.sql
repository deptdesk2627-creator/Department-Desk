BEGIN;

LOCK TABLE public.transactions IN ACCESS EXCLUSIVE MODE;

DELETE FROM public.transaction_history;
ALTER TABLE public.transaction_history
  DROP CONSTRAINT IF EXISTS fk_transaction_history_request;
DROP TABLE public.transactions;

CREATE SEQUENCE public.transactions_ongoing_request_id_seq;
CREATE TABLE public.transactions_ongoing (
  request_id integer NOT NULL
    DEFAULT nextval('public.transactions_ongoing_request_id_seq'::regclass),
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
  archived_at timestamp without time zone,
  updated_at timestamp without time zone,
  created_at timestamp without time zone,
  CONSTRAINT transactions_ongoing_pkey PRIMARY KEY (request_id),
  CONSTRAINT fk_transactions_ongoing_user
    FOREIGN KEY (req_user_id) REFERENCES public.users(user_id),
  CONSTRAINT fk_transactions_ongoing_file_location
    FOREIGN KEY (file_location) REFERENCES public.file_location(location_id),
  CONSTRAINT fk_transactions_ongoing_origin_office
    FOREIGN KEY (origin_office) REFERENCES public.offices(office_id),
  CONSTRAINT fk_transactions_ongoing_current_office
    FOREIGN KEY (current_office) REFERENCES public.offices(office_id)
);
ALTER SEQUENCE public.transactions_ongoing_request_id_seq
  OWNED BY public.transactions_ongoing.request_id;

CREATE SEQUENCE public.transactions_incoming_request_id_seq;
CREATE TABLE public.transactions_incoming (
  request_id integer NOT NULL
    DEFAULT nextval('public.transactions_incoming_request_id_seq'::regclass),
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
  forwarded_to bigint,
  archived_at timestamp without time zone,
  updated_at timestamp without time zone,
  created_at timestamp without time zone,
  CONSTRAINT transactions_incoming_pkey PRIMARY KEY (request_id),
  CONSTRAINT fk_transactions_incoming_user
    FOREIGN KEY (req_user_id) REFERENCES public.users(user_id),
  CONSTRAINT fk_transactions_incoming_file_location
    FOREIGN KEY (file_location) REFERENCES public.file_location(location_id),
  CONSTRAINT fk_transactions_incoming_origin_office
    FOREIGN KEY (origin_office) REFERENCES public.offices(office_id),
  CONSTRAINT fk_transactions_incoming_current_office
    FOREIGN KEY (current_office) REFERENCES public.offices(office_id),
  CONSTRAINT fk_transactions_incoming_forwarded_to
    FOREIGN KEY (forwarded_to) REFERENCES public.offices(office_id)
);
ALTER SEQUENCE public.transactions_incoming_request_id_seq
  OWNED BY public.transactions_incoming.request_id;

COMMIT;

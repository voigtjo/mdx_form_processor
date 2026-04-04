alter table form_templates
  add column if not exists form_type text not null default 'generic_form';

create table if not exists customer_orders (
  document_id uuid primary key references documents(id) on delete cascade,
  order_number text,
  customer_name text,
  service_location text,
  material text,
  work_description_html text,
  work_signature_at timestamptz,
  approval_status text,
  status text,
  service_date text,
  technician text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists production_records (
  document_id uuid primary key references documents(id) on delete cascade,
  batch_id text,
  serial_number text,
  product_name text,
  production_line text,
  process_steps_json jsonb not null default '[]'::jsonb,
  work_signature_at timestamptz,
  approval_status text,
  status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists qualification_records (
  document_id uuid primary key references documents(id) on delete cascade,
  qualification_record_number text,
  qualification_title text,
  owner_user_id uuid references users(id),
  valid_until text,
  qualification_result text,
  qualification_topics_json jsonb not null default '[]'::jsonb,
  evaluation_status text,
  score_value integer,
  passed boolean,
  evaluated_at timestamptz,
  approval_status text,
  status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists generic_form_records (
  document_id uuid primary key references documents(id) on delete cascade,
  form_title text,
  description text,
  note text,
  approval_status text,
  status text,
  payload_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table customer_orders add column if not exists work_description_html text;
alter table customer_orders add column if not exists work_signature_at timestamptz;
alter table customer_orders add column if not exists status text;
alter table production_records add column if not exists process_steps_json jsonb not null default '[]'::jsonb;
alter table production_records add column if not exists work_signature_at timestamptz;
alter table production_records add column if not exists status text;
alter table qualification_records add column if not exists qualification_topics_json jsonb not null default '[]'::jsonb;
alter table qualification_records add column if not exists evaluation_status text;
alter table qualification_records add column if not exists score_value integer;
alter table qualification_records add column if not exists passed boolean;
alter table qualification_records add column if not exists evaluated_at timestamptz;
alter table qualification_records add column if not exists status text;
alter table generic_form_records add column if not exists description text;
alter table generic_form_records add column if not exists note text;
alter table generic_form_records add column if not exists approval_status text;
alter table generic_form_records add column if not exists status text;

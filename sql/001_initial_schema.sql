create extension if not exists "pgcrypto";

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  display_name text not null,
  email text,
  description text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists groups (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  description text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id),
  group_id uuid not null references groups(id),
  rights text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, group_id)
);

create table if not exists workflow_templates (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  name text not null,
  description text,
  version integer not null,
  status text not null,
  workflow_json jsonb not null default '{}'::jsonb,
  published_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (key, version)
);

create table if not exists form_templates (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  name text not null,
  description text,
  version integer not null,
  status text not null,
  workflow_template_id uuid not null references workflow_templates(id),
  mdx_body text not null,
  template_keys jsonb not null default '[]'::jsonb,
  document_keys jsonb not null default '[]'::jsonb,
  table_fields jsonb not null default '[]'::jsonb,
  visibility_rules jsonb not null default '{}'::jsonb,
  published_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (key, version)
);

create table if not exists template_assignments (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references form_templates(id),
  group_id uuid not null references groups(id),
  status text default 'active',
  assigned_at timestamptz not null default now(),
  unique (template_id, group_id)
);

create table if not exists operations (
  operation_ref text primary key,
  name text,
  connector text,
  module_path text not null,
  auth_strategy text not null,
  description text,
  input_schema jsonb,
  output_schema jsonb,
  tags jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references form_templates(id),
  template_version integer not null,
  workflow_template_id uuid not null references workflow_templates(id),
  workflow_template_version integer not null,
  status text not null,
  data_json jsonb not null default '{}'::jsonb,
  external_json jsonb not null default '{}'::jsonb,
  snapshot_json jsonb not null default '{}'::jsonb,
  integration_context_json jsonb not null default '{}'::jsonb,
  created_by uuid not null references users(id),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists assignments (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id),
  user_id uuid not null references users(id),
  role text not null,
  assigned_by uuid references users(id),
  assigned_at timestamptz not null default now(),
  active boolean not null default true
);

create table if not exists attachments (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id),
  filename text not null,
  mime_type text not null,
  size bigint not null,
  storage_key text not null,
  uploaded_by uuid not null references users(id),
  created_at timestamptz not null default now()
);

create table if not exists audit_events (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id),
  event_type text not null,
  actor_user_id uuid references users(id),
  message text,
  payload_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);


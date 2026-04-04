create table if not exists reference_entities (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_key text not null,
  display_name text not null,
  status text not null default 'active',
  source text not null default 'csv',
  data_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (entity_type, entity_key)
);

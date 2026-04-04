alter table operations
  add column if not exists id uuid default gen_random_uuid(),
  add column if not exists key text,
  add column if not exists title text,
  add column if not exists status text not null default 'draft',
  add column if not exists auth_mode text,
  add column if not exists request_schema_json jsonb,
  add column if not exists response_schema_json jsonb,
  add column if not exists handler_ts_source text,
  add column if not exists tags_json jsonb,
  add column if not exists published_at timestamptz,
  add column if not exists archived_at timestamptz;

update operations
set
  id = coalesce(id, gen_random_uuid()),
  key = coalesce(key, operation_ref),
  title = coalesce(title, name, operation_ref),
  auth_mode = coalesce(auth_mode, auth_strategy),
  request_schema_json = coalesce(request_schema_json, input_schema, '{}'::jsonb),
  response_schema_json = coalesce(response_schema_json, output_schema, '{}'::jsonb),
  tags_json = coalesce(tags_json, tags, '[]'::jsonb),
  handler_ts_source = coalesce(handler_ts_source, ''),
  published_at = case
    when published_at is null and status = 'published' then now()
    else published_at
  end;

alter table operations
  alter column id set not null,
  alter column key set not null,
  alter column title set not null,
  alter column connector set not null,
  alter column auth_mode set not null,
  alter column request_schema_json set not null,
  alter column response_schema_json set not null,
  alter column handler_ts_source set not null,
  alter column tags_json set not null;

create unique index if not exists operations_id_unique_idx on operations (id);
create unique index if not exists operations_key_unique_idx on operations (key);

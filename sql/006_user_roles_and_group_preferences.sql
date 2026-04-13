alter table users
  add column if not exists global_roles text not null default '',
  add column if not exists preferred_group_id uuid references groups(id);

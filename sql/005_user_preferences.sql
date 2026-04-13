alter table users
  add column if not exists locale text not null default 'de';

alter table users
  add column if not exists preferred_template_key text;

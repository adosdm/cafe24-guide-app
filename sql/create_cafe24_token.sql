create table cafe24_token (
  id uuid primary key default gen_random_uuid(),
  mall_id text not null unique,
  access_token text not null,
  refresh_token text not null,
  expires_at timestamp with time zone not null,
  updated_at timestamp with time zone default now()
);

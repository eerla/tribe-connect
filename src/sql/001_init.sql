-- 001_init.sql
-- Enable extensions
create extension if not exists "pgcrypto";

-- Profiles (links to auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  username text unique,
  bio text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tribes (groups)
create table if not exists public.tribes (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references auth.users (id) on delete cascade,
  title text not null,
  slug text unique,
  description text,
  cover_url text,
  city text,
  is_private boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_tribes_city on public.tribes (city);

-- Tribe members
create table if not exists public.tribe_members (
  id uuid primary key default gen_random_uuid(),
  tribe_id uuid not null references public.tribes (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text default 'member', -- owner, moderator, member
  joined_at timestamptz default now(),
  unique (tribe_id, user_id)
);

create index if not exists idx_tribe_members_tribe on public.tribe_members (tribe_id);

-- Events
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  tribe_id uuid references public.tribes (id) on delete set null,
  organizer uuid not null references auth.users (id) on delete cascade,
  title text not null,
  slug text unique,
  description text,
  banner_url text,
  location text,
  latitude numeric,
  longitude numeric,
  starts_at timestamptz,
  ends_at timestamptz,
  capacity int,
  price numeric default 0,
  is_cancelled boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_events_starts_at on public.events (starts_at);
create index if not exists idx_events_location on public.events (location);

-- Event attendees / RSVPs
create table if not exists public.event_attendees (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  status text default 'going', -- going, interested, canceled
  joined_at timestamptz default now(),
  unique (event_id, user_id)
);

create index if not exists idx_event_attendees_event on public.event_attendees (event_id);

-- Event comments
create table if not exists public.event_comments (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  body text not null,
  created_at timestamptz default now()
);

create index if not exists idx_event_comments_event on public.event_comments (event_id);

-- Messages (realtime chat) - store per tribe/event
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  channel text not null, -- e.g., "tribe:{id}" or "event:{id}"
  user_id uuid not null references auth.users (id) on delete cascade,
  body text not null,
  metadata jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_messages_channel on public.messages (channel);

-- Notifications
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  actor_id uuid references auth.users (id),
  type text not null,
  payload jsonb,
  is_read boolean default false,
  created_at timestamptz default now()
);

create index if not exists idx_notifications_user on public.notifications (user_id);

-- ------------------------------------------------------
-- Row Level Security (RLS) - enable and add simple policies
-- ------------------------------------------------------

-- Enable RLS for tables where we want to restrict access
alter table public.profiles enable row level security;
alter table public.tribes enable row level security;
alter table public.tribe_members enable row level security;
alter table public.events enable row level security;
alter table public.event_attendees enable row level security;
alter table public.event_comments enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;

-- Helper function to check auth.uid()
create or replace function public.is_owner(p_owner uuid) returns boolean language sql as $$
  select auth.jwt()::json->>'sub' = p_owner::text;
$$;

-- Profiles: user can read and update own profile; anyone authenticated can insert (profile created on signup)
create policy "profiles_select_authenticated" on public.profiles for select using (auth.role() = 'authenticated');
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
create policy "profiles_insert" on public.profiles for insert with check (auth.uid() = id);

-- Tribes: public select; insert for authenticated; update/delete by owner
create policy "tribes_select" on public.tribes for select using (true);
create policy "tribes_insert" on public.tribes for insert with check (auth.role() = 'authenticated');
create policy "tribes_manage_owner" on public.tribes for update using (auth.uid() = owner);
create policy "tribes_delete_owner" on public.tribes for delete using (auth.uid() = owner);

-- Tribe members: members can read; insert allowed for auth users joining; delete allowed for owner/moderator or the user leaving
create policy "tribe_members_select" on public.tribe_members for select using (true);
create policy "tribe_members_insert" on public.tribe_members for insert with check (auth.role() = 'authenticated');
create policy "tribe_members_delete_own" on public.tribe_members for delete using (auth.uid() = user_id OR auth.uid() = (select owner from public.tribes where id = tribe_id));

-- Events: public select; insert by authenticated; update/delete by organizer
create policy "events_select" on public.events for select using (true);
create policy "events_insert" on public.events for insert with check (auth.role() = 'authenticated');
create policy "events_manage_organizer" on public.events for update using (auth.uid() = organizer);
create policy "events_delete_organizer" on public.events for delete using (auth.uid() = organizer);

-- Event attendees: insert by authenticated; select attendees for event is allowed
create policy "event_attendees_select" on public.event_attendees for select using (true);
create policy "event_attendees_insert" on public.event_attendees for insert with check (auth.role() = 'authenticated');
create policy "event_attendees_delete_own" on public.event_attendees for delete using (auth.uid() = user_id);

-- Event comments: allow insert/select for authenticated
create policy "event_comments_select" on public.event_comments for select using (true);
create policy "event_comments_insert" on public.event_comments for insert with check (auth.role() = 'authenticated');

-- Messages: insert by authenticated; select limited to messages if user is member of tribe OR event attendee OR public tribe
-- For simplicity: select all messages (you can refine later)
create policy "messages_select" on public.messages for select using (true);
create policy "messages_insert" on public.messages for insert with check (auth.role() = 'authenticated');

-- Notifications: only recipient can read; insert by server (we'll allow server via service role or functions)
create policy "notifications_select" on public.notifications for select using (auth.uid() = user_id);
create policy "notifications_insert_server" on public.notifications for insert with check (true); -- we recommend to insert via server/service key

-- update updated_at triggers
create or replace function public.set_timestamp() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_timestamp_profiles before update on public.profiles for each row execute procedure public.set_timestamp();
create trigger set_timestamp_tribes before update on public.tribes for each row execute procedure public.set_timestamp();
create trigger set_timestamp_events before update on public.events for each row execute procedure public.set_timestamp();

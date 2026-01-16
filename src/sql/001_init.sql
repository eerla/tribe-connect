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
  updated_at timestamptz default now(),
  location text
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
  category text,
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
  tribe_id uuid references public.tribes (id) on delete cascade,
  organizer uuid not null references auth.users (id) on delete cascade,
  title text not null,
  slug text unique,
  description text,
  banner_url text,
  location text,
  category text,
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
CREATE INDEX IF NOT EXISTS idx_tribes_category ON public.tribes (category);
CREATE INDEX IF NOT EXISTS idx_events_category ON public.events (category);
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

-- Handle new user - create profile on signup
-- Inside src/sql/001_init.sql
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
AS $$
DECLARE
  generated_username TEXT;
BEGIN
  -- Create a base username from full_name or email
  generated_username := LOWER(REGEXP_REPLACE(
    COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
    '[^a-z0-9]+', '-', 'gi'
  ));
  generated_username := REGEXP_REPLACE(generated_username, '^-+|-+$', '', 'g');

  -- Generate a unique username using the existing slug logic
  generated_username := public.generate_unique_slug(generated_username, 'profiles', NEW.id);

  INSERT INTO public.profiles (id, full_name, username, created_at, updated_at) -- Add username here
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    generated_username, -- Insert the generated unique username
    now(),
    now()
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- if profile already exists, do nothing (shouldn't happen with auth.users insert)
    RETURN NEW;
  WHEN others THEN
    RAISE WARNING 'handle_new_user failed for user %: % (sqlstate=%)', NEW.id, SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$;

create trigger on_auth_user_created after insert on auth.users for each row
  execute procedure public.handle_new_user();

create trigger set_timestamp_profiles before update on public.profiles for each row execute procedure public.set_timestamp();
create trigger set_timestamp_tribes before update on public.tribes for each row execute procedure public.set_timestamp();
create trigger set_timestamp_events before update on public.events for each row execute procedure public.set_timestamp();

-- Ensure tribe deletion also removes related messages and other non-FK data
-- Function to cleanup tribe-related rows that are not referenced by FK constraints
create or replace function public.delete_tribe_related_objects() returns trigger language plpgsql as $$
begin
  -- remove messages in the tribe channel
  delete from public.messages where channel = 'tribe:' || old.id;
  -- add other cleanup operations here if needed (notifications, files, etc.)
  return old;
end;
$$;

-- Install trigger (safe to run multiple times: drop then create)
drop trigger if exists trigger_delete_tribe_related on public.tribes;
create trigger trigger_delete_tribe_related
  after delete on public.tribes
  for each row
  execute procedure public.delete_tribe_related_objects();

-- Migration for existing databases: replace events.tribe_id FK to cascade on delete
-- Drop existing FK (if present) and recreate with ON DELETE CASCADE
alter table if exists public.events drop constraint if exists events_tribe_id_fkey;
alter table if exists public.events
  add constraint events_tribe_id_fkey foreign key (tribe_id) references public.tribes(id) on delete cascade;

-- Allow authenticated users to upload to any bucket
create policy "storage_insert_authenticated" on storage.objects
  for insert
  with check (auth.role() = 'authenticated');

-- Allow public read access to objects (optional, for displaying images)
create policy "storage_select_public" on storage.objects
  for select
  using (true);


-- Allow authenticated users to upload to avatars bucket
create policy "storage_insert_authenticated_avatars" on storage.objects
  for insert
  with check (auth.role() = 'authenticated' AND bucket_id = 'avatars');

-- Allow public read access to avatars
create policy "storage_select_public_avatars" on storage.objects
  for select
  using (bucket_id = 'avatars');

-- -- Add missing location column to profiles table -- #TODO
-- alter table public.profiles 
-- add column if not exists location text;

-- Enable RLS on storage objects (run once):
alter table storage.objects enable row level security;

-- create policy \"storage_insert_authenticated_<bucket>\" on storage.objects
--   for insert
--   with check ( auth.role() = 'authenticated' AND bucket_id = '<bucket>' );

--   create policy \"storage_select_public_<bucket>\" on storage.objects
--   for select
--   using ( bucket_id = '<bucket>' );

  -- Repeat the two create policy statements for each bucket (avatars, events, tribes).



-- event saves (bookmarks)
create table if not exists public.event_saves (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  saved_at timestamptz default now(),
  unique (event_id, user_id)
);

-- RLS
alter table public.event_saves enable row level security;

create policy "event_saves_select" on public.event_saves for select using (auth.role() = 'authenticated');
create policy "event_saves_insert" on public.event_saves for insert with check (auth.uid() = user_id);
create policy "event_saves_delete_own" on public.event_saves for delete using (auth.uid() = user_id);

create index if not exists idx_event_saves_event on public.event_saves (event_id);
create index if not exists idx_event_saves_user on public.event_saves (user_id);

-- tribe chat
-- Messages: enforce membership/ownership
drop policy if exists "messages_select" on public.messages;
drop policy if exists "messages_insert" on public.messages;

-- Tribe channels
create policy "messages_select_tribe_member" on public.messages
for select using (
  channel like 'tribe:%'
  and (
    exists (
      select 1 from public.tribe_members tm
      where tm.tribe_id = split_part(channel, ':', 2)::uuid
        and tm.user_id = auth.uid()
    )
    or exists (
      select 1 from public.tribes t
      where t.id = split_part(channel, ':', 2)::uuid
        and t.owner = auth.uid()
    )
  )
);

create policy "messages_insert_tribe_member" on public.messages
for insert with check (
  channel like 'tribe:%'
  and (
    exists (
      select 1 from public.tribe_members tm
      where tm.tribe_id = split_part(channel, ':', 2)::uuid
        and tm.user_id = auth.uid()
    )
    or exists (
      select 1 from public.tribes t
      where t.id = split_part(channel, ':', 2)::uuid
        and t.owner = auth.uid()
    )
  )
);

-- Event channels (optional now, add if you plan event chat)
create policy "messages_select_event_attendee_or_organizer" on public.messages
for select using (
  channel like 'event:%'
  and (
    exists (
      select 1 from public.event_attendees ea
      where ea.event_id = split_part(channel, ':', 2)::uuid
        and ea.user_id = auth.uid()
    )
    or exists (
      select 1 from public.events e
      where e.id = split_part(channel, ':', 2)::uuid
        and e.organizer = auth.uid()
    )
  )
);

create policy "messages_insert_event_attendee_or_organizer" on public.messages
for insert with check (
  channel like 'event:%'
  and (
    exists (
      select 1 from public.event_attendees ea
      where ea.event_id = split_part(channel, ':', 2)::uuid
        and ea.user_id = auth.uid()
    )
    or exists (
      select 1 from public.events e
      where e.id = split_part(channel, ':', 2)::uuid
        and e.organizer = auth.uid()
    )
  )
);

-- Event comments: user can delete own; organizer can delete any on their event
create policy "event_comments_delete_own" on public.event_comments 
for delete using (auth.uid() = user_id);

create policy "event_comments_delete_organizer" on public.event_comments
for delete using (
  exists (
    select 1 from public.events e
    where e.id = event_comments.event_id
      and e.organizer = auth.uid()
  )
);


-- Allow users to update their own notifications (for marking as read)
create policy "notifications_update_own" on public.notifications 
for update using (auth.uid() = user_id);

-- Update event_comments insert policy to block cancelled events
drop policy if exists "event_comments_insert" on public.event_comments;

create policy "event_comments_insert" on public.event_comments 
for insert with check (
  auth.role() = 'authenticated' 
  and not exists (
    select 1 from public.events e 
    where e.id = event_comments.event_id 
      and e.is_cancelled = true
  )
);


DROP POLICY IF EXISTS "profiles_select_authenticated" ON "public"."profiles";

CREATE POLICY "profiles_select_public"
ON "public"."profiles"
FOR SELECT
TO public
USING (true);


-- Add is_deleted column to tribes table
ALTER TABLE tribes ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;

-- Add is_deleted column to events table (for consistency, though you're using is_cancelled)
ALTER TABLE events ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;

-- ===
-- ============================================
-- IMPROVED SLUG GENERATION WITH COLLISION HANDLING
-- ============================================
CREATE OR REPLACE FUNCTION public.generate_unique_slug(
  base_slug TEXT,
  table_name TEXT,
  record_id UUID DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  tmp_slug TEXT;
  counter INTEGER := 1;
  exists_check BOOLEAN;
BEGIN
  tmp_slug := base_slug;
  
  LOOP
    IF table_name = 'tribes' THEN
      SELECT EXISTS(
        SELECT 1 FROM public.tribes t
        WHERE t.slug = tmp_slug 
        AND (record_id IS NULL OR t.id != record_id)
      ) INTO exists_check;
    ELSIF table_name = 'events' THEN
      SELECT EXISTS(
        SELECT 1 FROM public.events e
        WHERE e.slug = tmp_slug 
        AND (record_id IS NULL OR e.id != record_id)
      ) INTO exists_check;
    ELSIF table_name = 'profiles' THEN -- NEW: Handle profiles table
      SELECT EXISTS(
        SELECT 1 FROM public.profiles p
        WHERE p.username = tmp_slug -- Query against username column
        AND (record_id IS NULL OR p.id != record_id)
      ) INTO exists_check;
    ELSE
      RAISE EXCEPTION 'Unknown table: %', table_name;
    END IF;
    
    IF NOT exists_check THEN
      RETURN tmp_slug;
    END IF;
    
    tmp_slug := base_slug || '-' || counter;
    counter := counter + 1;
  END LOOP;
END;
$$;


-- Function to auto-generate slug for tribes
CREATE OR REPLACE FUNCTION public.auto_generate_tribe_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  base_slug TEXT;
BEGIN
  -- Only generate if slug is NULL or empty
  IF NEW.slug IS NULL OR TRIM(NEW.slug) = '' THEN
    -- Create base slug from title
    base_slug := LOWER(REGEXP_REPLACE(TRIM(NEW.title), '[^a-z0-9]+', '-', 'gi'));
    base_slug := REGEXP_REPLACE(base_slug, '^-+|-+$', '', 'g');
    
    -- Generate unique slug
    NEW.slug := public.generate_unique_slug(base_slug, 'tribes', NEW.id);
  ELSE
    -- Ensure provided slug is unique
    NEW.slug := public.generate_unique_slug(NEW.slug, 'tribes', NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Function to auto-generate slug for events
CREATE OR REPLACE FUNCTION public.auto_generate_event_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  base_slug TEXT;
BEGIN
  -- Only generate if slug is NULL or empty
  IF NEW.slug IS NULL OR TRIM(NEW.slug) = '' THEN
    -- Create base slug from title
    base_slug := LOWER(REGEXP_REPLACE(TRIM(NEW.title), '[^a-z0-9]+', '-', 'gi'));
    base_slug := REGEXP_REPLACE(base_slug, '^-+|-+$', '', 'g');
    
    -- Generate unique slug
    NEW.slug := public.generate_unique_slug(base_slug, 'events', NEW.id);
  ELSE
    -- Ensure provided slug is unique
    NEW.slug := public.generate_unique_slug(NEW.slug, 'events', NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create triggers
DROP TRIGGER IF EXISTS tribe_slug_trigger ON public.tribes;
CREATE TRIGGER tribe_slug_trigger
  BEFORE INSERT OR UPDATE OF title, slug ON public.tribes
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_generate_tribe_slug();

DROP TRIGGER IF EXISTS event_slug_trigger ON public.events;
CREATE TRIGGER event_slug_trigger
  BEFORE INSERT OR UPDATE OF title, slug ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_generate_event_slug();

-- ============================================
-- SLUG HISTORY FOR 301 REDIRECTS
-- ============================================
-- Create slug_history table for 301 redirects
CREATE TABLE IF NOT EXISTS public.slug_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('tribe', 'event')),
  entity_id UUID NOT NULL,
  old_slug TEXT NOT NULL,
  new_slug TEXT NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (entity_type, old_slug)
);

CREATE INDEX IF NOT EXISTS slug_history_lookup_idx ON public.slug_history(entity_type, old_slug);

-- Function to track slug changes
CREATE OR REPLACE FUNCTION public.track_slug_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only track if slug actually changed
  IF OLD.slug IS DISTINCT FROM NEW.slug THEN
    INSERT INTO public.slug_history (entity_type, entity_id, old_slug, new_slug)
    VALUES (
      CASE TG_TABLE_NAME
        WHEN 'tribes' THEN 'tribe'
        WHEN 'events' THEN 'event'
      END,
      NEW.id,
      OLD.slug,
      NEW.slug
    )
    ON CONFLICT (entity_type, old_slug) DO UPDATE
    SET new_slug = EXCLUDED.new_slug, changed_at = now();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create triggers for slug history tracking
DROP TRIGGER IF EXISTS tribe_slug_history_trigger ON public.tribes;
CREATE TRIGGER tribe_slug_history_trigger
  AFTER UPDATE OF slug ON public.tribes
  FOR EACH ROW
  EXECUTE FUNCTION public.track_slug_change();

DROP TRIGGER IF EXISTS event_slug_history_trigger ON public.events;
CREATE TRIGGER event_slug_history_trigger
  AFTER UPDATE OF slug ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.track_slug_change();

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Slug uniqueness migration completed successfully!';
  RAISE NOTICE 'Features enabled:';
  RAISE NOTICE '  - Automatic slug generation from titles';
  RAISE NOTICE '  - Collision handling with numeric suffixes';
  RAISE NOTICE '  - Slug history for 301 redirects';
  RAISE NOTICE '  - is_cancelled, is_deleted columns added';
END $$;


-- Add is_new_user column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_new_user BOOLEAN DEFAULT true;


-- edit events and tribes policies to allow owners to update
-- ============================================
-- ADD UPDATED_AT COLUMNS & EDIT RLS POLICIES
-- ============================================
-- ============================================
-- RLS POLICY: Allow event organizer to update their own events
-- ============================================
DROP POLICY IF EXISTS "Users can update own events" ON public.events;

CREATE POLICY "Users can update own events"
  ON public.events
  FOR UPDATE
  USING (auth.uid() = organizer)
  WITH CHECK (auth.uid() = organizer);

-- ============================================
-- RLS POLICY: Allow tribe owner to update their own tribes
-- ============================================
DROP POLICY IF EXISTS "Users can update own tribes" ON public.tribes;

CREATE POLICY "Users can update own tribes"
  ON public.tribes
  FOR UPDATE
  USING (auth.uid() = owner)
  WITH CHECK (auth.uid() = owner);

-- ============================================
-- HELPER FUNCTION: Update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END
$$;

-- ============================================
-- TRIGGER: Automatically update updated_at on events
-- ============================================
DROP TRIGGER IF EXISTS update_events_updated_at ON public.events;

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- TRIGGER: Automatically update updated_at on tribes
-- ============================================
DROP TRIGGER IF EXISTS update_tribes_updated_at ON public.tribes;

CREATE TRIGGER update_tribes_updated_at
  BEFORE UPDATE ON public.tribes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
-- Add slug column to events if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='slug') THEN
    ALTER TABLE public.events ADD COLUMN slug TEXT;
  END IF;
END $$;

-- Add NOT NULL constraint and UNIQUE constraint to events.slug
ALTER TABLE public.events ALTER COLUMN slug SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS events_slug_unique_idx ON public.events(slug);

-- Add is_cancelled and is_deleted to events if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='is_cancelled') THEN
    ALTER TABLE public.events ADD COLUMN is_cancelled BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='is_deleted') THEN
    ALTER TABLE public.events ADD COLUMN is_deleted BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tribes' AND column_name='is_deleted') THEN
    ALTER TABLE public.tribes ADD COLUMN is_deleted BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Function to generate a unique slug
CREATE OR REPLACE FUNCTION public.generate_unique_slug(
  base_slug TEXT,
  table_name TEXT,
  record_id UUID DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  slug TEXT;
  counter INTEGER := 1;
  exists_check BOOLEAN;
BEGIN
  -- Start with the base slug
  slug := base_slug;
  
  -- Loop until we find a unique slug
  LOOP
    -- Check if slug exists (excluding current record if updating)
    IF table_name = 'tribes' THEN
      SELECT EXISTS(
        SELECT 1 FROM public.tribes 
        WHERE tribes.slug = slug 
        AND (record_id IS NULL OR tribes.id != record_id)
      ) INTO exists_check;
    ELSIF table_name = 'events' THEN
      SELECT EXISTS(
        SELECT 1 FROM public.events 
        WHERE events.slug = slug 
        AND (record_id IS NULL OR events.id != record_id)
      ) INTO exists_check;
    ELSE
      RAISE EXCEPTION 'Unknown table: %', table_name;
    END IF;
    
    -- If unique, return the slug
    IF NOT exists_check THEN
      RETURN slug;
    END IF;
    
    -- Otherwise, increment counter and try again
    slug := base_slug || '-' || counter;
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

-- Backfill slugs for existing events that don't have them
DO $$
DECLARE
  event_record RECORD;
  base_slug TEXT;
BEGIN
  FOR event_record IN (SELECT id, title FROM public.events WHERE slug IS NULL) LOOP
    base_slug := LOWER(REGEXP_REPLACE(TRIM(event_record.title), '[^a-z0-9]+', '-', 'gi'));
    base_slug := REGEXP_REPLACE(base_slug, '^-+|-+$', '', 'g');
    
    UPDATE public.events
    SET slug = public.generate_unique_slug(base_slug, 'events', event_record.id)
    WHERE id = event_record.id;
  END LOOP;
END $$;

-- ============================================
-- CLEAN UP EXISTING SLUG IMPLEMENTATION
-- ============================================
-- Drop existing triggers and functions
DROP TRIGGER IF EXISTS events_set_slug ON public.events;
DROP TRIGGER IF EXISTS tribes_set_slug ON public.tribes;
DROP TRIGGER IF EXISTS tribe_slug_trigger ON public.tribes;
DROP TRIGGER IF EXISTS event_slug_trigger ON public.events;
DROP TRIGGER IF EXISTS tribe_slug_history_trigger ON public.tribes;
DROP TRIGGER IF EXISTS event_slug_history_trigger ON public.events;
DROP FUNCTION IF EXISTS public.set_slug_if_missing();
DROP FUNCTION IF EXISTS public.generate_slug(TEXT, UUID);
DROP FUNCTION IF EXISTS public.generate_unique_slug(TEXT, TEXT, UUID);
DROP FUNCTION IF EXISTS public.auto_generate_tribe_slug();
DROP FUNCTION IF EXISTS public.auto_generate_event_slug();
DROP FUNCTION IF EXISTS public.track_slug_change();

-- ============================================
-- ADD MISSING COLUMNS
-- ============================================
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
  IF NEW.slug IS NULL OR TRIM(NEW.slug) = '' THEN
    base_slug := LOWER(REGEXP_REPLACE(TRIM(NEW.title), '[^a-z0-9]+', '-', 'gi'));
    base_slug := REGEXP_REPLACE(base_slug, '^-+|-+$', '', 'g');
    NEW.slug := public.generate_unique_slug(base_slug, 'tribes', NEW.id);
  ELSE
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
  IF NEW.slug IS NULL OR TRIM(NEW.slug) = '' THEN
    base_slug := LOWER(REGEXP_REPLACE(TRIM(NEW.title), '[^a-z0-9]+', '-', 'gi'));
    base_slug := REGEXP_REPLACE(base_slug, '^-+|-+$', '', 'g');
    NEW.slug := public.generate_unique_slug(base_slug, 'events', NEW.id);
  ELSE
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
-- Fix function search_path security warnings
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_tribe_member_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.tribes SET member_count = member_count + 1 WHERE id = NEW.tribe_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.tribes SET member_count = member_count - 1 WHERE id = OLD.tribe_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_event_attendee_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.events SET attendee_count = attendee_count + 1 WHERE id = NEW.event_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.events SET attendee_count = attendee_count - 1 WHERE id = OLD.event_id;
  END IF;
  RETURN NULL;
END;
$$;
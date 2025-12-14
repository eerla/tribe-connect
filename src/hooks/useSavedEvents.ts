import { useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export default function useSavedEvents() {
  const { user } = useAuth();
  const [savingIds, setSavingIds] = useState<Record<string, boolean>>({});
  const [savedEvents, setSavedEvents] = useState<any[]>([]);

  const checkSaved = useCallback(async (eventId: string) => {
    if (!user?.id) return false;
    try {
      const { data, error } = await supabase
        .from('event_saves')
        .select('id')
        .match({ event_id: eventId, user_id: user.id })
        .limit(1);

      if (error) throw error;
      return Boolean(data && data.length > 0);
    } catch (err) {
      console.error('Error checking saved status', err);
      return false;
    }
  }, [user?.id]);

  const fetchSavedEvents = useCallback(async (userId?: string) => {
    const uid = userId || user?.id;
    if (!uid) {
      setSavedEvents([]);
      return [];
    }
    try {
      const { data, error } = await supabase
        .from('event_saves')
        .select('saved_at, event:events(*)')
        .eq('user_id', uid)
        .order('saved_at', { ascending: false });

      if (error) throw error;

      const events = (data || []).map((row: any) => row.event).filter(Boolean);
      setSavedEvents(events);
      return events;
    } catch (err) {
      console.error('Error fetching saved events', err);
      setSavedEvents([]);
      return [];
    }
  }, [user?.id]);

  const toggleSave = useCallback(async (eventId: string) => {
    if (!user?.id) {
      toast({ title: 'Sign in required', description: 'Please sign in to save events' });
      return false;
    }

    setSavingIds(prev => ({ ...prev, [eventId]: true }));

    try {
      const { data: existing, error: errExisting } = await supabase
        .from('event_saves')
        .select('id')
        .match({ event_id: eventId, user_id: user.id })
        .limit(1);

      if (errExisting) throw errExisting;

      if (existing && existing.length > 0) {
        const { error } = await supabase
          .from('event_saves')
          .delete()
          .match({ event_id: eventId, user_id: user.id });

        if (error) throw error;
        toast({ title: 'Removed', description: 'Event removed from Saved' });
        // refresh saved list
        fetchSavedEvents();
        return false;
      }

      const { error } = await supabase
        .from('event_saves')
        .insert({ event_id: eventId, user_id: user.id });

      if (error) {
        if (error.code === '23505' || (error.message || '').toLowerCase().includes('duplicate')) {
          toast({ title: 'Saved', description: 'Event saved for later' });
          await fetchSavedEvents();
          return true;
        }
        throw error;
      }

      toast({ title: 'Saved', description: 'Event saved for later' });
      await fetchSavedEvents();
      return true;
    } catch (err: any) {
      console.error('Error toggling save', err);
      toast({ title: 'Error', description: err?.message || 'Failed to save event', variant: 'destructive' });
      return false;
    } finally {
      setSavingIds(prev => {
        const copy = { ...prev };
        delete copy[eventId];
        return copy;
      });
    }
  }, [user?.id, fetchSavedEvents]);

  return { checkSaved, toggleSave, savingIds, savedEvents, fetchSavedEvents };
}

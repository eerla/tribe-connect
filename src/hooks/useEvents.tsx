import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Event {
  id: string;
  tribe_id?: string | null;
  organizer?: string;
  title?: string;
  slug?: string;
  description?: string | null;
  banner_url?: string | null;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  starts_at?: string;
  ends_at?: string | null;
  capacity?: number | null;
  price?: number;
  is_cancelled?: boolean;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export function useEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('is_cancelled', false)
          .order('starts_at', { ascending: true });
        // console.log(' events response:', data);
        if (error) throw error;
        setEvents(data || []);
      } catch (err) {
        setError(err as Error);
        console.error('Error fetching events:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, []);

  return { events, isLoading, error };
}

export function useEventById(eventId: string) {
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!eventId) {
      setIsLoading(false);
      return;
    }

    const fetchEvent = async () => {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('id', eventId)
          .single();

        if (error) throw error;
        setEvent(data);
      } catch (err) {
        setError(err as Error);
        console.error('Error fetching event:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvent();
  }, [eventId]);

  return { event, isLoading, error };
}

export function useUserEvents(userId: string | undefined) {
  const [organizedEvents, setOrganizedEvents] = useState<Event[]>([]);
  const [attendingEvents, setAttendingEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    const fetchUserEvents = async () => {
      try {
        // Get events the user organized
        const { data: organizedData, error: organizedError } = await supabase
          .from('events')
          .select('*')
          .eq('organizer', userId)
          .eq('is_cancelled', false);

        if (organizedError) throw organizedError;
        setOrganizedEvents(organizedData || []);

        // Get events the user is attending via event_attendees
        const { data: attendeesData, error: attendeesError } = await supabase
          .from('event_attendees')
          .select('event_id')
          .eq('user_id', userId);

        if (attendeesError) throw attendeesError;

        const attendeeEventIds = attendeesData?.map(a => a.event_id) || [];
        
        if (attendeeEventIds.length > 0) {
          const { data: attendingData, error: attendingError } = await supabase
            .from('events')
            .select('*')
            .in('id', attendeeEventIds)
            .eq('is_cancelled', false);

          if (attendingError) throw attendingError;
          setAttendingEvents(attendingData || []);
        } else {
          setAttendingEvents([]);
        }
      } catch (err) {
        setError(err as Error);
        console.error('Error fetching user events:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserEvents();
  }, [userId]);

  return { organizedEvents, attendingEvents, isLoading, error };
}
